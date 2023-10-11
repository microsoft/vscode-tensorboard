// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';
import { QuickPickItem, Uri, l10n, window, workspace } from 'vscode';
import { traceDebug } from './common/logging';
import { TensorBoard } from './common/localize';
import { SystemVariables } from './common/systemVariables';

// Display a quickpick asking the user to acknowledge our autopopulated log directory or
// select a new one using the file picker. Default this to the folder that is open in
// the editor, if any, then the directory that the active text editor is in, if any.
export async function getLogDirectory() {
    // If we have a single workspace folder or none, use that
    if (workspace.workspaceFolders?.length === 0 || workspace.workspaceFolders?.length === 1) {
        const resourceUri = workspace.workspaceFolders?.[0]?.uri;
        const value = getLogDirectoryForResource(resourceUri);
        if (value) {
            const systemVariables = new SystemVariables(resourceUri, resourceUri?.fsPath);
            return systemVariables.resolve(value);
        }
    }

    // Else we have no idea, do not return anything
    // No log directory in settings. Ask the user which directory to use
    const logDir = getSuggestedLogDir();
    const { enterRemoteUrl } = TensorBoard;
    const items: QuickPickItem[] = getQuickPickItems(logDir);
    const item = await window.showQuickPick(items, {
        canPickMany: false,
        ignoreFocusOut: false,
        placeHolder: logDir ? l10n.t('Current: {0}', logDir) : undefined
    });
    switch (item?.label) {
        case TensorBoard.useCurrentWorkingDirectory:
            return logDir;
        case TensorBoard.selectAFolder:
        case TensorBoard.selectAnotherFolder:
            return showFilePicker();
        case enterRemoteUrl:
            return window.showInputBox({
                prompt: TensorBoard.enterRemoteUrlDetail
            });
    }
}

async function showFilePicker(): Promise<string | undefined> {
    const selection = await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false
    });
    // If the user selected a folder, return the uri.fsPath
    // There will only be one selection since canSelectMany: false
    if (selection) {
        return selection[0].fsPath;
    }
    return undefined;
}

function getQuickPickItems(logDir: string | undefined) {
    const items = [];

    if (logDir) {
        const useCwd = {
            label: TensorBoard.useCurrentWorkingDirectory,
            detail: TensorBoard.useCurrentWorkingDirectoryDetail
        };
        const selectAnotherFolder = {
            label: TensorBoard.selectAnotherFolder,
            detail: TensorBoard.selectAnotherFolderDetail
        };
        items.push(useCwd, selectAnotherFolder);
    } else {
        const selectAFolder = {
            label: TensorBoard.selectAFolder,
            detail: TensorBoard.selectAFolderDetail
        };
        items.push(selectAFolder);
    }

    items.push({
        label: TensorBoard.enterRemoteUrl,
        detail: TensorBoard.enterRemoteUrlDetail
    });

    return items;
}

function getLogDirectoryForResource(resource?: Uri) {
    const config = workspace.getConfiguration('python', resource);
    const settingValue = config.get<{ logDirectory?: string }>('tensorBoard')?.logDirectory;
    if (settingValue) {
        traceDebug(`Using log directory resolved by python.tensorBoard.logDirectory setting: ${settingValue}`);
        return settingValue;
    }
}
function getSuggestedLogDir(): string | undefined {
    return window.activeTextEditor ? path.dirname(window.activeTextEditor.document.uri.fsPath) : undefined;
}
