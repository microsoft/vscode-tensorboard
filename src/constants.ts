// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export enum TensorBoardPromptSelection {
    Yes = 'yes',
    No = 'no',
    DoNotAskAgain = 'doNotAskAgain',
    None = 'none'
}

export enum TensorBoardEntrypointTrigger {
    tfeventfiles = 'tfeventfiles',
    fileimport = 'fileimport',
    nbextension = 'nbextension',
    palette = 'palette'
}

export enum TensorBoardSessionStartResult {
    cancel = 'canceled',
    success = 'success',
    error = 'error'
}

export namespace Commands {
    export const LaunchTensorBoard = 'python.launchTensorBoard';
    export const RefreshTensorBoard = 'python.refreshTensorBoard';
}

export enum EventName {
    TENSORBOARD_SESSION_LAUNCH = 'TENSORBOARD.SESSION_LAUNCH',
    TENSORBOARD_SESSION_DURATION = 'TENSORBOARD.SESSION_DURATION',
    TENSORBOARD_SESSION_DAEMON_STARTUP_DURATION = 'TENSORBOARD.SESSION_DAEMON_STARTUP_DURATION',
    TENSORBOARD_LAUNCH_PROMPT_SELECTION = 'TENSORBOARD.LAUNCH_PROMPT_SELECTION',
    TENSORBOARD_SESSION_E2E_STARTUP_DURATION = 'TENSORBOARD.SESSION_E2E_STARTUP_DURATION',
    TENSORBOARD_ENTRYPOINT_SHOWN = 'TENSORBOARD.ENTRYPOINT_SHOWN',
    TENSORBOARD_INSTALL_PROMPT_SHOWN = 'TENSORBOARD.INSTALL_PROMPT_SHOWN',
    TENSORBOARD_INSTALL_PROMPT_SELECTION = 'TENSORBOARD.INSTALL_PROMPT_SELECTION',
    TENSORBOARD_DETECTED_IN_INTEGRATED_TERMINAL = 'TENSORBOARD_DETECTED_IN_INTEGRATED_TERMINAL',
    TENSORBOARD_PACKAGE_INSTALL_RESULT = 'TENSORBOARD.PACKAGE_INSTALL_RESULT',
    TENSORBOARD_TORCH_PROFILER_IMPORT = 'TENSORBOARD.TORCH_PROFILER_IMPORT',
    TENSORBOARD_JUMP_TO_SOURCE_REQUEST = 'TENSORBOARD_JUMP_TO_SOURCE_REQUEST',
    TENSORBOARD_JUMP_TO_SOURCE_FILE_NOT_FOUND = 'TENSORBOARD_JUMP_TO_SOURCE_FILE_NOT_FOUND'
}

export const PYTHON_LANGUAGE = 'python';
export const PYTHON_WARNINGS = 'PYTHONWARNINGS';

export const NotebookCellScheme = 'vscode-notebook-cell';
export const InteractiveInputScheme = 'vscode-interactive-input';
export const InteractiveScheme = 'vscode-interactive';

export enum TensorBoardEntrypoint {
    prompt = 'prompt',
    codelens = 'codelens',
    palette = 'palette'
}

export const PYTHON = [
    { scheme: 'file', language: PYTHON_LANGUAGE },
    { scheme: 'untitled', language: PYTHON_LANGUAGE },
    { scheme: 'vscode-notebook', language: PYTHON_LANGUAGE },
    { scheme: NotebookCellScheme, language: PYTHON_LANGUAGE },
    { scheme: InteractiveInputScheme, language: PYTHON_LANGUAGE }
];
