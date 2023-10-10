// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as fs from 'fs';
import { ChildProcess } from 'child_process';
import {
    CancellationToken,
    env,
    Event,
    EventEmitter,
    Memento,
    Position,
    Progress,
    ProgressLocation,
    ProgressOptions,
    QuickPickItem,
    Selection,
    TextEditorRevealType,
    Uri,
    ViewColumn,
    WebviewPanel,
    WebviewPanelOnDidChangeViewStateEvent,
    window,
    workspace
} from 'vscode';
import { TensorBoardSessionStartResult } from './constants';
import { StopWatch } from './common/stopwatch';
import { traceDebug, traceError } from './common/logging';
import { TensorBoard } from './common/localize';
import { raceCancellation, sleep } from './common/async';
import { getLogDirectory } from './configuration';
import { PythonExtension } from '@vscode/python-extension';
import { disposableStore } from './common/lifecycle';
import { sendJumptToSource, sendJumptToSourceNotFound, sendTensorboardStartupResult } from './common/telemetry';
import { TensorboardLauncher } from './tensorboardLauncher';
import { dependencies } from './dependencyChecker';

enum Messages {
    JumpToSource = 'jump_to_source'
}

const PREFERRED_VIEWGROUP = 'PythonTensorBoardWebviewPreferredViewGroup';

export function tensorboardLauncher(extensionRoot: Uri, args: string[]): string[] {
    const script = Uri.joinPath(extensionRoot, 'tensorboard_launcher.py');
    return [script.fsPath, ...args];
}

/**
 * Manages the lifecycle of a TensorBoard session.
 * Specifically, it:
 * - ensures the TensorBoard Python package is installed,
 * - asks the user for a log directory to start TensorBoard with
 * - spawns TensorBoard in a background process which must stay running
 *   to serve the TensorBoard website
 * - frames the TensorBoard website in a VSCode webview
 * - shuts down the TensorBoard process when the webview is closed
 */
export class TensorBoardSession {
    public get panel(): WebviewPanel | undefined {
        return this.webviewPanel;
    }

    public get daemon(): ChildProcess | undefined {
        return this.process;
    }

    private _active = false;

    private webviewPanel: WebviewPanel | undefined;

    private url: string | undefined;

    private process: ChildProcess | undefined;

    private onDidChangeViewStateEventEmitter = new EventEmitter<void>();

    private onDidDisposeEventEmitter = new EventEmitter<TensorBoardSession>();

    constructor(private readonly globalMemento: Memento) {}

    public get onDidDispose(): Event<TensorBoardSession> {
        return this.onDidDisposeEventEmitter.event;
    }

    public get onDidChangeViewState(): Event<void> {
        return this.onDidChangeViewStateEventEmitter.event;
    }

    public get active(): boolean {
        return this._active;
    }

    public async refresh(): Promise<void> {
        if (!this.webviewPanel) {
            return;
        }
        this.webviewPanel.webview.html = '';
        this.webviewPanel.webview.html = await this.getHtml();
    }

    public async initialize(): Promise<void> {
        const tensorBoardWasInstalled = await dependencies.ensurePrerequisitesAreInstalled();
        if (!tensorBoardWasInstalled) {
            return;
        }
        const logDir = await getLogDirectory();
        if (!logDir) {
            return;
        }
        const startedSuccessfully = await this.startTensorboardSession(logDir);
        if (startedSuccessfully) {
            await this.showPanel();
        }
    }

    // Spawn a process which uses TensorBoard's Python API to start a TensorBoard session.
    // Times out if it hasn't started up after 1 minute.
    // Hold on to the process so we can kill it when the webview is closed.
    private async startTensorboardSession(logDir: string): Promise<boolean> {
        const pythonApi = await PythonExtension.api();
        const interpreter = pythonApi.environments.getActiveEnvironmentPath(Uri.file(logDir));
        if (!interpreter) {
            return false;
        }

        // Timeout waiting for TensorBoard to start after 60 seconds.
        // This is the same time limit that TensorBoard itself uses when waiting for
        // its webserver to start up.
        const timeout = 60_000;

        // Display a progress indicator as TensorBoard takes at least a couple seconds to launch
        const progressOptions: ProgressOptions = {
            title: TensorBoard.progressMessage,
            location: ProgressLocation.Notification,
            cancellable: true
        };

        const sessionStartStopwatch = new StopWatch();
        const proc = await TensorboardLauncher.launch(interpreter, logDir);
        const result = await window.withProgress(
            progressOptions,
            (_progress: Progress<unknown>, token: CancellationToken) => {
                traceDebug(`Starting TensorBoard with log directory ${logDir}...`);

                const spawnTensorBoard = TensorboardLauncher.waitForStart(proc, token);

                return Promise.race([
                    sleep(timeout).then(() => timeout),
                    raceCancellation(token, 'canceled', spawnTensorBoard)
                ]);
            }
        );

        switch (result) {
            case 'canceled':
                traceDebug('Canceled starting TensorBoard session.');
                sendTensorboardStartupResult(sessionStartStopwatch.elapsed, TensorBoardSessionStartResult.cancel);
                proc.kill();
                return false;
            case 'success':
                this.process = proc;
                sendTensorboardStartupResult(sessionStartStopwatch.elapsed, TensorBoardSessionStartResult.success);
                return true;
            case timeout:
                proc.kill();
                sendTensorboardStartupResult(sessionStartStopwatch.elapsed, TensorBoardSessionStartResult.error);
                throw new Error(`Timed out after ${timeout / 1000} seconds waiting for TensorBoard to launch.`);
            default:
                // We should never get here
                throw new Error(`Failed to start TensorBoard, received unknown promise result: ${result}`);
        }
    }

    private async showPanel() {
        traceDebug('Showing TensorBoard panel');
        const panel = this.webviewPanel || (await this.createPanel());
        panel.reveal();
        this._active = true;
        this.onDidChangeViewStateEventEmitter.fire();
    }

    private async createPanel() {
        const webviewPanel = window.createWebviewPanel(
            'tensorBoardSession',
            'TensorBoard',
            this.globalMemento.get(PREFERRED_VIEWGROUP, ViewColumn.Active),
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        webviewPanel.webview.html = await this.getHtml();
        this.webviewPanel = webviewPanel;
        disposableStore.add(
            webviewPanel.onDidDispose(() => {
                this.webviewPanel = undefined;
                // Kill the running TensorBoard session
                this.process?.kill();
                this.process = undefined;
                this._active = false;
                this.onDidDisposeEventEmitter.fire(this);
            })
        );
        disposableStore.add(
            webviewPanel.onDidChangeViewState(async (args: WebviewPanelOnDidChangeViewStateEvent) => {
                // The webview has been moved to a different viewgroup if it was active before and remains active now
                if (this.active && args.webviewPanel.active) {
                    await this.globalMemento.update(PREFERRED_VIEWGROUP, webviewPanel.viewColumn ?? ViewColumn.Active);
                }
                this._active = args.webviewPanel.active;
                this.onDidChangeViewStateEventEmitter.fire();
            })
        );
        disposableStore.add(
            webviewPanel.webview.onDidReceiveMessage((message) => {
                // Handle messages posted from the webview
                switch (message.command) {
                    case Messages.JumpToSource:
                        void this.jumpToSource(message.args.filename, message.args.line);
                        break;
                    default:
                        break;
                }
            })
        );
        return webviewPanel;
    }

    private async jumpToSource(fsPath: string, line: number) {
        sendJumptToSource();
        let uri: Uri | undefined;
        if (fs.existsSync(fsPath)) {
            uri = Uri.file(fsPath);
        } else {
            sendJumptToSourceNotFound();
            traceError(
                `Requested jump to source filepath ${fsPath} does not exist. Prompting user to select source file...`
            );
            // Prompt the user to pick the file on disk
            const items: QuickPickItem[] = [
                {
                    label: TensorBoard.selectMissingSourceFile,
                    description: TensorBoard.selectMissingSourceFileDescription
                }
            ];
            const selection = await window.showQuickPick(items, {
                title: TensorBoard.missingSourceFile,
                placeHolder: fsPath
            });
            switch (selection?.label) {
                case TensorBoard.selectMissingSourceFile: {
                    const filePickerSelection = await window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false
                    });
                    if (filePickerSelection !== undefined) {
                        [uri] = filePickerSelection;
                    }
                    break;
                }
                default:
                    break;
            }
        }
        if (uri === undefined) {
            return;
        }
        const document = await workspace.openTextDocument(uri);
        const editor = await window.showTextDocument(document, ViewColumn.Beside);
        // Select the line if it exists in the document
        if (line < editor.document.lineCount) {
            const position = new Position(line, 0);
            const selection = new Selection(position, editor.document.lineAt(line).range.end);
            editor.selection = selection;
            editor.revealRange(selection, TextEditorRevealType.InCenterIfOutsideViewport);
        }
    }

    private async getHtml() {
        // We cannot cache the result of calling asExternalUri, so regenerate
        // it each time. From docs: "Note that extensions should not cache the
        // result of asExternalUri as the resolved uri may become invalid due
        // to a system or user action — for example, in remote cases, a user may
        // close a port forwarding tunnel that was opened by asExternalUri."
        const fullWebServerUri = await env.asExternalUri(Uri.parse(this.url!));
        return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'unsafe-inline'; frame-src ${fullWebServerUri} http: https:;">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TensorBoard</title>
            </head>
            <body>
                <script type="text/javascript">
                    (function() {
                        const vscode = acquireVsCodeApi();
                        function resizeFrame() {
                            var f = window.document.getElementById('vscode-tensorboard-iframe');
                            if (f) {
                                f.style.height = window.innerHeight / 0.8 + "px";
                                f.style.width = window.innerWidth / 0.8 + "px";
                            }
                        }
                        window.onload = function() {
                            resizeFrame();
                        }
                        window.addEventListener('resize', resizeFrame);
                        window.addEventListener('message', (event) => {
                            if (!"${fullWebServerUri}".startsWith(event.origin) || !event.data || !event.data.filename || !event.data.line) {
                                return;
                            }
                            const args = { filename: event.data.filename, line: event.data.line };
                            vscode.postMessage({ command: '${Messages.JumpToSource}', args: args });
                        });
                    }())
                </script>
                <iframe
                    id="vscode-tensorboard-iframe"
                    class="responsive-iframe"
                    sandbox="allow-scripts allow-forms allow-same-origin allow-pointer-lock"
                    src="${fullWebServerUri}"
                    frameborder="0"
                    border="0"
                    allowfullscreen
                ></iframe>
                <style>
                    .responsive-iframe {
                        transform: scale(0.8);
                        transform-origin: 0 0;
                        position: absolute;
                        top: 0;
                        left: 0;
                        overflow: hidden;
                        display: block;
                        width: 100%;
                        height: 100%;
                    }
                </style>
            </body>
        </html>`;
    }
}
