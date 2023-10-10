// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CancellationToken, CodeLens, Command, Position, Range, TextDocument, languages } from 'vscode';
import { disposableStore } from './common/lifecycle';
import { containsTensorBoardImport } from './helpers';
import { Commands, PYTHON, TensorBoardEntrypoint, TensorBoardEntrypointTrigger } from './constants';
import { Localized } from './common/localize';
import { sendTensorboardEntrypointTriggered } from './common/telemetry';

export class TensorBoardImportCodeLensProvider {
    public readonly supportedWorkspaceTypes = { untrustedWorkspace: false, virtualWorkspace: false };
    private telemetrySent = false;
    private sendTelemetryOnce() {
        if (this.telemetrySent) {
            return;
        }
        this.telemetrySent = true;

        sendTensorboardEntrypointTriggered(TensorBoardEntrypointTrigger.fileimport, TensorBoardEntrypoint.codelens);
    }

    // eslint-disable-next-line class-methods-use-this
    public provideCodeLenses(document: TextDocument, cancelToken: CancellationToken): CodeLens[] {
        const command: Command = {
            title: Localized.launchNativeTensorBoardSessionCodeLens,
            command: Commands.LaunchTensorBoard,
            arguments: [
                { trigger: TensorBoardEntrypointTrigger.fileimport, entrypoint: TensorBoardEntrypoint.codelens }
            ]
        };
        const codelenses: CodeLens[] = [];
        for (let index = 0; index < document.lineCount; index += 1) {
            if (cancelToken.isCancellationRequested) {
                return codelenses;
            }
            const line = document.lineAt(index);
            if (containsTensorBoardImport([line.text])) {
                const range = new Range(new Position(line.lineNumber, 0), new Position(line.lineNumber, 1));
                codelenses.push(new CodeLens(range, command));
                this.sendTelemetryOnce();
            }
        }
        return codelenses;
    }

    public activate() {
        disposableStore.add(languages.registerCodeLensProvider(PYTHON, this));
    }
}
