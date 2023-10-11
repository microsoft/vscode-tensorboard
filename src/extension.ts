// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ExtensionContext } from 'vscode';
import { disposableStore } from './common/lifecycle';
import { trackInstallOfExtension } from './common/telemetry';
import { ExtensionInfo } from './constants';
import { TensorBoardSessionProvider } from './tensorBoardSessionProvider';
import { TerminalWatcher } from './terminalWatcher';
import { TensorBoardImportCodeLensProvider } from './tensorBoardImportCodeLensProvider';
import { TensorBoardFileWatcher } from './tensorBoardFileWatcher';
import { TensorBoardNbextensionCodeLensProvider } from './nbextensionCodeLensProvider';
import { promptIfTensorboardIsUsedInEditors } from './tensorBoardUsageTracker';
import { PrivatePythonApi, PrivatePythonApiProvider } from './pythonApi';

export async function activate(context: ExtensionContext) {
    ExtensionInfo.context = context;
    trackInstallOfExtension();
    context.subscriptions.push(disposableStore);
    context.subscriptions.push(new TensorBoardSessionProvider());
    context.subscriptions.push(new TerminalWatcher());
    context.subscriptions.push(new TensorBoardFileWatcher());
    context.subscriptions.push(TensorBoardImportCodeLensProvider.registerCodeLensProvider());
    context.subscriptions.push(TensorBoardNbextensionCodeLensProvider.registerCodeLensProvider());
    context.subscriptions.push(promptIfTensorboardIsUsedInEditors());
    const apiProvider = PrivatePythonApiProvider.instance;
    void apiProvider.getApi();
    return { registerPythonApi: (api: PrivatePythonApi) => apiProvider.registerPythonApi(api) };
}
