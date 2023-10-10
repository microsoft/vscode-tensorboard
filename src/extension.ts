// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ExtensionContext } from 'vscode';
import { disposableStore } from './common/lifecycle';
import { trackInstallOfExtension } from './common/telemetry';

export async function activate(context: ExtensionContext) {
    trackInstallOfExtension();
    context.subscriptions.push(disposableStore);
}
