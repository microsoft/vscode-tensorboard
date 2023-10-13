// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CodeLens, Command, languages, Position, Range } from 'vscode';
import { Commands, PYTHON, TensorBoardEntrypoint, TensorBoardEntrypointTrigger } from './constants';
import { containsNotebookExtension, containsTensorBoardImport } from './helpers';
import { Localized } from './common/localize';
import { sendTensorboardEntrypointTriggered } from './common/telemetry';
import { once } from './common/functional';

const sendNotebookTelemetry = once(() =>
    sendTensorboardEntrypointTriggered(TensorBoardEntrypointTrigger.nbextension, TensorBoardEntrypoint.codelens)
);
const sendPythonTelemetry = once(() =>
    sendTensorboardEntrypointTriggered(TensorBoardEntrypointTrigger.fileimport, TensorBoardEntrypoint.codelens)
);

export function registerCodeLensProvider() {
    return languages.registerCodeLensProvider(PYTHON, {
        provideCodeLenses: (document, token) => {
            const codelenses: CodeLens[] = [];
            for (let index = 0; index < document.lineCount; index += 1) {
                if (token.isCancellationRequested) {
                    return codelenses;
                }
                const { lineNumber, text } = document.lineAt(index);
                const trigger = containsNotebookExtension([text])
                    ? TensorBoardEntrypointTrigger.nbextension
                    : containsTensorBoardImport([text])
                    ? TensorBoardEntrypointTrigger.fileimport
                    : undefined;
                if (trigger) {
                    const command: Command = {
                        title: Localized.launchNativeTensorBoardSessionCodeLens,
                        command: Commands.LaunchTensorBoard,
                        arguments: [{ trigger, entrypoint: TensorBoardEntrypoint.codelens }]
                    };
                    const range = new Range(new Position(lineNumber, 0), new Position(lineNumber, 1));
                    codelenses.push(new CodeLens(range, command));
                    if (trigger === TensorBoardEntrypointTrigger.nbextension) {
                        sendNotebookTelemetry();
                    } else {
                        sendPythonTelemetry();
                    }
                }
            }
            return codelenses;
        }
    });
}
