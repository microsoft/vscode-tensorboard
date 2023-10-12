// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CancellationToken, CodeLens, Command, Disposable, languages, Position, Range, TextDocument } from 'vscode';
import {
    Commands,
    NotebookCellScheme,
    PYTHON,
    PYTHON_LANGUAGE,
    TensorBoardEntrypoint,
    TensorBoardEntrypointTrigger
} from './constants';
import { containsNotebookExtension } from './helpers';
import { Localized } from './common/localize';
import { sendTensorboardEntrypointTriggered } from './common/telemetry';
import { once } from './common/functional';

export function registerCodeLensProvider() {
    const disposable1 = languages.registerCodeLensProvider(
        [
            { scheme: NotebookCellScheme, language: PYTHON_LANGUAGE },
            { scheme: 'vscode-notebook', language: PYTHON_LANGUAGE }
        ],
        {
            provideCodeLenses: (document, token) =>
                provideCodeLenses(
                    TensorBoardEntrypointTrigger.nbextension,
                    document,
                    token,
                    once(() =>
                        sendTensorboardEntrypointTriggered(
                            TensorBoardEntrypointTrigger.nbextension,
                            TensorBoardEntrypoint.codelens
                        )
                    )
                )
        }
    );
    const disdposable2 = languages.registerCodeLensProvider(PYTHON, {
        provideCodeLenses: (document, token) =>
            provideCodeLenses(
                TensorBoardEntrypointTrigger.fileimport,
                document,
                token,
                once(() =>
                    sendTensorboardEntrypointTriggered(
                        TensorBoardEntrypointTrigger.fileimport,
                        TensorBoardEntrypoint.codelens
                    )
                )
            )
    });
    return Disposable.from(disposable1, disdposable2);
}

function provideCodeLenses(
    trigger: TensorBoardEntrypointTrigger,
    document: TextDocument,
    cancelToken: CancellationToken,
    sendTelemetry: (trigger: TensorBoardEntrypointTrigger) => void
): CodeLens[] {
    const command: Command = {
        title: Localized.launchNativeTensorBoardSessionCodeLens,
        command: Commands.LaunchTensorBoard,
        arguments: [{ trigger, entrypoint: TensorBoardEntrypoint.codelens }]
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
            sendTelemetry(trigger);
        }
    }
    return codelenses;
}
