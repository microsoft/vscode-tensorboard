// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { commands, l10n, window, workspace } from 'vscode';
import { traceDebug, traceError } from './common/logging';
import { Commands, TensorBoardEntrypoint, TensorBoardEntrypointTrigger } from './constants';
import { TensorBoardSession } from './tensorBoardSession';
import { BaseDisposable } from './common/lifecycle';
import { sendTensorboardLaunch } from './common/telemetry';
import { hasFileBasedWorkspace } from './helpers';

export class TensorBoardSessionProvider extends BaseDisposable {
    public readonly supportedWorkspaceTypes = { untrustedWorkspace: false, virtualWorkspace: false };

    private knownSessions: TensorBoardSession[] = [];
    private commandsRegistered = false;

    constructor() {
        super();
        this.registerCommands();
        this._register(workspace.onDidGrantWorkspaceTrust(this.registerCommands, this));
    }

    private registerCommands() {
        if (this.commandsRegistered) {
            return;
        }
        if (!hasFileBasedWorkspace()) {
            return;
        }
        this.commandsRegistered = true;
        this._register(
            commands.registerCommand(
                Commands.LaunchTensorBoard,
                (
                    entrypoint: TensorBoardEntrypoint = TensorBoardEntrypoint.palette,
                    trigger: TensorBoardEntrypointTrigger = TensorBoardEntrypointTrigger.palette
                ) => {
                    sendTensorboardLaunch(entrypoint, trigger);
                    return this.createNewSession();
                }
            )
        );
        this._register(
            commands.registerCommand(Commands.RefreshTensorBoard, () => this.knownSessions.map((w) => w.refresh()))
        );
    }
    private updateTensorBoardSessionContext() {
        let hasActiveTensorBoardSession = false;
        this.knownSessions.forEach((viewer) => {
            if (viewer.active) {
                hasActiveTensorBoardSession = true;
            }
        });
        void commands.executeCommand(
            'setContext',
            'tensorboard.hasActiveTensorBoardSession',
            hasActiveTensorBoardSession
        );
    }

    private async didDisposeSession(session: TensorBoardSession) {
        this.knownSessions = this.knownSessions.filter((s) => s !== session);
        this.updateTensorBoardSessionContext();
    }

    private async createNewSession(): Promise<TensorBoardSession | undefined> {
        traceDebug('Starting new TensorBoard session...');
        try {
            const newSession = new TensorBoardSession();
            this._register(newSession.onDidChangeViewState(this.updateTensorBoardSessionContext, this));
            this._register(newSession.onDidDispose(this.didDisposeSession, this));
            this._register(newSession);
            this.knownSessions.push(newSession);
            await newSession.start();
            return newSession;
        } catch (e) {
            traceError(`Encountered error while starting new TensorBoard session:`, e);
            await window.showErrorMessage(
                l10n.t('Failed to start a TensorBoard session due to the following error: {0}', (e as Error).message)
            );
        }
    }
}
