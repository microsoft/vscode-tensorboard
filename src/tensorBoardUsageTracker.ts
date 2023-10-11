// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';
import { TextEditor, window } from 'vscode';
import { IDisposable } from './common/lifecycle';
import { containsTensorBoardImport } from './helpers';
import { TensorBoardPrompt } from './tensorBoardPrompt';
import { TensorBoardEntrypointTrigger } from './constants';

// Prompt the user to start an integrated TensorBoard session whenever the active Python file or Python notebook
// contains a valid TensorBoard import.
export function promptIfTensorboardIsUsedInEditors(): IDisposable {
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
                void TensorBoardPrompt.showNativeTensorBoardPrompt(TensorBoardEntrypointTrigger.fileimport);
            }
        }
    }
}
