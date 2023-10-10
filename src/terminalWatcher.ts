// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { window } from 'vscode';
import { disposableStore } from './common/lifecycle';
import { sendTensorboardDetectedInTerminal } from './common/telemetry';

// Every 5 min look, through active terminals to see if any are running `tensorboard`
export class TerminalWatcher {
    public readonly supportedWorkspaceTypes = { untrustedWorkspace: false, virtualWorkspace: false };

    private handle: NodeJS.Timeout | undefined;

    public async activate(): Promise<void> {
        const handle = setInterval(() => {
            // When user runs a command in VSCode terminal, the terminal's name
            // becomes the program that is currently running. Since tensorboard
            // stays running in the terminal while the webapp is running and
            // until the user kills it, the terminal with the updated name should
            // stick around for long enough that we only need to run this check
            // every 5 min or so
            const matches = window.terminals.filter((terminal) => terminal.name === 'tensorboard');
            if (matches.length > 0) {
                sendTensorboardDetectedInTerminal();
                clearInterval(handle); // Only need telemetry sent once per VS Code session
            }
        }, 300_000);
        this.handle = handle;
        disposableStore.add(this);
    }

    public dispose(): void {
        if (this.handle) {
            clearInterval(this.handle);
        }
    }
}
