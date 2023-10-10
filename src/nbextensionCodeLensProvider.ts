// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CancellationToken, CodeLens, Command, languages, Position, Range, TextDocument } from 'vscode';
import {
    Commands,
    NotebookCellScheme,
    PYTHON_LANGUAGE,
    TensorBoardEntrypoint,
    TensorBoardEntrypointTrigger
} from './constants';
import { containsNotebookExtension } from './helpers';
import { disposableStore } from './common/lifecycle';
import { Localized } from './common/localize';
import { sendTensorboardEntrypointTriggered } from './common/telemetry';

export class TensorBoardNbextensionCodeLensProvider {
    public readonly supportedWorkspaceTypes = { untrustedWorkspace: false, virtualWorkspace: false };
    private telemtetrySent = false;
    private sendTelemetryOnce() {
        if (this.telemtetrySent) {
            return;
        }
        this.telemtetrySent = true;
        sendTensorboardEntrypointTriggered(TensorBoardEntrypointTrigger.nbextension, TensorBoardEntrypoint.codelens);
    }

    public async activate() {
        disposableStore.add(
            languages.registerCodeLensProvider(
                [
                    { scheme: NotebookCellScheme, language: PYTHON_LANGUAGE },
                    { scheme: 'vscode-notebook', language: PYTHON_LANGUAGE }
                ],
                this
            )
        );
    }

    public provideCodeLenses(document: TextDocument, cancelToken: CancellationToken): CodeLens[] {
        const command: Command = {
            title: Localized.launchNativeTensorBoardSessionCodeLens,
            command: Commands.LaunchTensorBoard,
            arguments: [
                { trigger: TensorBoardEntrypointTrigger.nbextension, entrypoint: TensorBoardEntrypoint.codelens }
            ]
        };
        const codelenses: CodeLens[] = [];
        for (let index = 0; index < document.lineCount; index += 1) {
            if (cancelToken.isCancellationRequested) {
                return codelenses;
            }
            const line = document.lineAt(index);
            if (containsNotebookExtension([line.text])) {
                const range = new Range(new Position(line.lineNumber, 0), new Position(line.lineNumber, 1));
                codelenses.push(new CodeLens(range, command));
                this.sendTelemetryOnce();
            }
        }
        return codelenses;
    }
}
