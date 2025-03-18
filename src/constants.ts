// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ExtensionContext } from 'vscode';

export enum TensorBoardPromptSelection {
  Yes = 'yes',
  No = 'no',
  DoNotAskAgain = 'doNotAskAgain',
  None = 'none',
}

export enum TensorBoardEntrypointTrigger {
  tfeventfiles = 'tfeventfiles',
  fileimport = 'fileimport',
  nbextension = 'nbextension',
  palette = 'palette',
}

export enum TensorBoardSessionStartResult {
  cancel = 'canceled',
  success = 'success',
  error = 'error',
}

export namespace Commands {
  export const LaunchTensorBoard = 'tensorboard.launch';
  export const RefreshTensorBoard = 'tensorboard.refresh';
  export const StopTensorBoard = 'tensorboard.stop';
}

export const PYTHON_LANGUAGE = 'python';

export const NotebookCellScheme = 'vscode-notebook-cell';
export const InteractiveInputScheme = 'vscode-interactive-input';
export const PythonExtensionId = 'ms-python.python';

export enum TensorBoardEntrypoint {
  prompt = 'prompt',
  codelens = 'codelens',
  palette = 'palette',
}

export const PYTHON = [
  { scheme: 'file', language: PYTHON_LANGUAGE },
  { scheme: 'untitled', language: PYTHON_LANGUAGE },
  { scheme: 'vscode-notebook', language: PYTHON_LANGUAGE },
  { scheme: NotebookCellScheme, language: PYTHON_LANGUAGE },
  { scheme: InteractiveInputScheme, language: PYTHON_LANGUAGE },
];

export const ExtensionInfo: {
  context: ExtensionContext;
  // Value will be set in extension.ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = {} as any;
