// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Disposable, window } from 'vscode';
import { BaseDisposable } from './common/lifecycle';
import { sendTensorboardDetectedInTerminal } from './common/telemetry';

// Every 5 min look, through active terminals to see if any are running `tensorboard`
export class TerminalWatcher extends BaseDisposable {
    constructor() {
        super();
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
        this._register(new Disposable(() => clearInterval(handle)));
        this._register(this);
    }
}
