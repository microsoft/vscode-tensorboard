// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';
import {
    Disposable,
    FileSystemWatcher,
    RelativePattern,
    TextEditor,
    WorkspaceFolder,
    WorkspaceFoldersChangeEvent,
    window,
    workspace
} from 'vscode';
import { DisposableStore, IDisposable } from './common/lifecycle';
import { containsTensorBoardImport } from './helpers';
import { TensorBoardPrompt } from './prompt';
import { TensorBoardEntrypointTrigger } from './constants';
import { sendTensorboardDetectedInTerminal } from './common/telemetry';
import { noop } from './common/utils';

const globPatterns = ['*tfevents*', '*/*tfevents*', '*/*/*tfevents*'];

export function watchFileSystemForTensorboardUsage() {
    const dispsoableStore = new DisposableStore();
    const fileSystemWatchers = new Map<WorkspaceFolder, FileSystemWatcher[]>();
    const folders = workspace.workspaceFolders;
    if (!folders) {
        return new Disposable(noop);
    }

    // If the user creates or changes tfevent files, listen for those too
    for (const folder of folders) {
        createFileSystemWatcher(folder, fileSystemWatchers, dispsoableStore);
    }

    // If workspace folders change, ensure we update our FileSystemWatchers
    dispsoableStore.add(
        workspace.onDidChangeWorkspaceFolders((e) => updateFileSystemWatchers(e, fileSystemWatchers, dispsoableStore))
    );
    return dispsoableStore;
}

function updateFileSystemWatchers(
    event: WorkspaceFoldersChangeEvent,
    fileSystemWatchers: Map<WorkspaceFolder, FileSystemWatcher[]>,
    dispsoableStore: DisposableStore
) {
    for (const added of event.added) {
        createFileSystemWatcher(added, fileSystemWatchers, dispsoableStore);
    }
    for (const removed of event.removed) {
        const watchers = fileSystemWatchers.get(removed);
        if (watchers) {
            Disposable.from(...watchers).dispose();
            fileSystemWatchers.delete(removed);
        }
    }
}

function createFileSystemWatcher(
    folder: WorkspaceFolder,
    fileSystemWatchers: Map<WorkspaceFolder, FileSystemWatcher[]>,
    dispsoableStore: DisposableStore
) {
    const fileWatchers = [];
    for (const pattern of globPatterns) {
        const relativePattern = new RelativePattern(folder, pattern);
        const fileSystemWatcher = workspace.createFileSystemWatcher(relativePattern);

        // When a file is created or changed that matches `this.globPattern`, try to show our prompt
        dispsoableStore.add(
            fileSystemWatcher.onDidCreate(() => TensorBoardPrompt.show(TensorBoardEntrypointTrigger.tfeventfiles))
        );
        dispsoableStore.add(
            fileSystemWatcher.onDidChange(() => TensorBoardPrompt.show(TensorBoardEntrypointTrigger.tfeventfiles))
        );
        dispsoableStore.add(fileSystemWatcher);
        fileWatchers.push(fileSystemWatcher);
    }
    fileSystemWatchers.set(folder, fileWatchers);
}

// Prompt the user to start an integrated TensorBoard session whenever the active Python file or Python notebook
// contains a valid TensorBoard import.
export function watchEditorsForTensorboardUsage(): IDisposable {
    // Process currently active text editor
    onChangedActiveTextEditor(window.activeTextEditor);
    // Process changes to active text editor as well
    return window.onDidChangeActiveTextEditor(onChangedActiveTextEditor);
}

function onChangedActiveTextEditor(editor: TextEditor | undefined): void {
    if (!editor || !editor.document) {
        return;
    }
    const { document } = editor;
    const extName = path.extname(document.fileName).toLowerCase();
    if (extName === '.py' || (extName === '.ipynb' && document.languageId === 'python')) {
        for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber += 1) {
            const line = document.lineAt(lineNumber);
            if (containsTensorBoardImport([line.text])) {
                void TensorBoardPrompt.show(TensorBoardEntrypointTrigger.fileimport);
            }
        }
    }
}

// Every 5 min look, through active terminals to see if any are running `tensorboard`
export function watchTerminalForTensorboardUsage(): Disposable {
    const handle = setInterval(() => {
        // When user runs a command in VSCode terminal, the terminal's name
        // becomes the program that is currently running. Since tensorboard
        // stays running in the terminal while the webapp is running and
        // until the user kills it, the terminal with the updated name should
        // stick around for long enough that we only need to run this check
        // every 5 min or so
        const matches = window.terminals.filter((terminal) => terminal.name === 'tensorboard');
        if (matches.length > 0) {
            sendTensorboardDetectedInTerminal();
            clearInterval(handle); // Only need telemetry sent once per VS Code session
        }
    }, 300_000);
    return new Disposable(() => clearInterval(handle));
}
