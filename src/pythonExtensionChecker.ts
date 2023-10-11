// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { EventEmitter, commands, extensions, l10n, window, workspace } from 'vscode';
import { BaseDisposable } from './common/lifecycle';
import { PythonExtensionId } from './constants';
import { noop } from './common/utils';
import { Common } from './common/localize';

export class PythonExtensionChecker extends BaseDisposable {
    private previousInstallState: boolean;
    private readonly pythonExtensionInstallationStatusChanged = this._register(
        new EventEmitter<'installed' | 'uninstalled'>()
    );
    public get onPythonExtensionInstallationStatusChanged() {
        return this.pythonExtensionInstallationStatusChanged.event;
    }
    /**
     * Used only for testing
     */
    public static promptDisplayed?: boolean;
    constructor() {
        super();
        // Listen for the python extension being installed or uninstalled
        this._register(extensions.onDidChange(this.extensionsChangeHandler, this));

        // Name is a bit different here as we use the isPythonExtensionInstalled property for checking the current state.
        // This property is to see if we change it during extension actions.
        this.previousInstallState = this.isPythonExtensionInstalled;
    }

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

    private async extensionsChangeHandler(): Promise<void> {
        // Check to see if we changed states, if so signal
        const newInstallState = this.isPythonExtensionInstalled;

        if (newInstallState !== this.previousInstallState) {
            this.pythonExtensionInstallationStatusChanged.fire(newInstallState ? 'installed' : 'uninstalled');
            this.previousInstallState = newInstallState;
        }
    }
}
