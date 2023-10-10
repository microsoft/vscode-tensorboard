// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ChildProcess, spawn } from 'child_process';
import { CancellationToken, Disposable, Uri } from 'vscode';
import { traceDebug, traceError } from './common/logging';
import { DisposableStore } from './common/lifecycle';
import { EnvironmentPath } from '@vscode/python-extension';
import { fileToCommandArgument } from './common/stringExtensions';

export namespace TensorboardLauncher {
    let extensionRoot: Uri;
    export function initialize(extRoot: Uri) {
        extensionRoot = extRoot;
    }
    export async function launch(pythonEnv: EnvironmentPath, logDir: string): Promise<ChildProcess> {
        // const api = await PythonExtension.api();
        const script = Uri.joinPath(extensionRoot, 'tensorboard_launcher.py');
        const args = [fileToCommandArgument(script.fsPath), fileToCommandArgument(logDir)];

        return spawn(pythonEnv.path, args, { cwd: logDir, env: process.env });
    }

    export function waitForStart(proc: ChildProcess, token: CancellationToken): Promise<string> {
        return new Promise<string>((resolve) => {
            const disposable = new DisposableStore();
            const stdOutHandler = (data: Buffer | string) => {
                const output = data.toString('utf8');
                const match = output.match(/TensorBoard started at (.*)/);
                if (match && match[1]) {
                    disposable.dispose();
                    resolve(match[1]);
                }
                traceDebug(output);
            };
            proc.stdout?.on('data', stdOutHandler);

            const stdErrHandler = (data: Buffer | string) => traceError(data.toString('utf8'));
            proc.stderr?.on('data', stdErrHandler);
            disposable.add(new Disposable(() => proc.stdout?.off('data', stdOutHandler)));
            disposable.add(new Disposable(() => proc.stderr?.off('data', stdErrHandler)));

            disposable.add(token.onCancellationRequested(() => disposable.dispose()));
        });
    }
}
