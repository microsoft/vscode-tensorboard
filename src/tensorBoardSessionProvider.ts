// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { commands, l10n, window } from 'vscode';
import { traceDebug, traceError } from './common/logging';
import { Commands, TensorBoardEntrypoint, TensorBoardEntrypointTrigger } from './constants';
import { TensorBoardSession } from './tensorBoardSession';
import { disposableStore } from './common/lifecycle';
import { sendTensorboardLaunch } from './common/telemetry';

export class TensorBoardSessionProvider {
    public readonly supportedWorkspaceTypes = { untrustedWorkspace: false, virtualWorkspace: false };

    private knownSessions: TensorBoardSession[] = [];

    public async activate(): Promise<void> {
        disposableStore.add(
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
        disposableStore.add(
            commands.registerCommand(Commands.RefreshTensorBoard, () => this.knownSessions.map((w) => w.refresh()))
        );
    }

    // private updateTensorBoardSessionContext() {
    //     let hasActiveTensorBoardSession = false;
    //     this.knownSessions.forEach((viewer) => {
    //         if (viewer.active) {
    //             hasActiveTensorBoardSession = true;
    //         }
    //     });
    //     void commands.executeCommand('setContext', 'python.hasActiveTensorBoardSession', hasActiveTensorBoardSession);
    // }

    // private async didDisposeSession(session: TensorBoardSession) {
    //     this.knownSessions = this.knownSessions.filter((s) => s !== session);
    //     this.updateTensorBoardSessionContext();
    // }

    private async createNewSession(): Promise<TensorBoardSession | undefined> {
        traceDebug('Starting new TensorBoard session...');
        try {
            // const newSession = new TensorBoardSession(
            //     this.installer,
            //     this.interpreterService,
            //     this.workspaceService,
            //     this.pythonExecFactory,
            //     this.commandManager,
            //     this.disposables,
            //     this.applicationShell,
            //     this.preferredViewGroupMemento,
            //     this.multiStepFactory,
            //     this.configurationService
            // );
            // newSession.onDidChangeViewState(this.updateTensorBoardSessionContext, this, this.disposables);
            // newSession.onDidDispose((e) => this.didDisposeSession(e), this, this.disposables);
            // this.knownSessions.push(newSession);
            // await newSession.initialize();
            // return newSession;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return undefined as any;
        } catch (e) {
            traceError(`Encountered error while starting new TensorBoard session:`, e);
            await window.showErrorMessage(
                l10n.t('Failed to start a TensorBoard session due to the following error: {0}', (e as Error).message)
            );
        }
    }
}
