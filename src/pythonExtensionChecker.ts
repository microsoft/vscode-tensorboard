// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { commands, extensions, l10n, window, workspace } from 'vscode';
import { BaseDisposable } from './common/lifecycle';
import { PythonExtensionId } from './constants';
import { noop } from './common/utils';
import { Common } from './common/localize';

export class PythonExtensionChecker extends BaseDisposable {
    /**
     * Used only for testing
     */
    static promptDisplayed?: boolean;

    public get isPythonExtensionInstalled() {
        return extensions.getExtension(PythonExtensionId) !== undefined;
    }
    // Notify the user that Python is require, and open up the Extension installation page to the
    // python extension
    public async showPythonExtensionInstallRequiredPrompt(): Promise<void> {
        // If workspace is not trusted, then don't show prompt
        if (!workspace.isTrusted) {
            return;
        }

        PythonExtensionChecker.promptDisplayed = true;
        // Ask user if they want to install and then wait for them to actually install it.
        const yes = Common.Yes;
        const answer = await window.showInformationMessage(
            l10n.t(
                'The Python Extension is required to perform that task. Click Yes to open Python Extension installation page.'
            ),
            { modal: true },
            yes
        );
        if (answer === yes) {
            await this.installPythonExtension();
        }
    }
    private async installPythonExtension() {
        // Have the user install python
        commands.executeCommand('extension.open', PythonExtensionId).then(noop, noop);
    }
}
