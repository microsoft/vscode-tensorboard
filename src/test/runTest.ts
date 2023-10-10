// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';
import { downloadAndUnzipVSCode, resolveCliPathFromVSCodeExecutablePath, runTests } from '@vscode/test-electron';
import { TEMP_DIR } from './constants';
import { dispose } from '../common/lifecycle';
import { spawnSync } from 'child_process';
import { getExtensionsDir } from './helpers';

async function main() {
    const disposables: { dispose(): void }[] = [];
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        const extensionTestsPath = path.resolve(__dirname, './suite/index');
        const vscodeExecutablePath = await downloadAndUnzipVSCode('insiders');
        const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
        const extensionsDir = await getExtensionsDir();

        console.info(`Installing Python Extension`);
        spawnSync(
            cliPath,
            [
                '--install-extension',
                'ms-python.python',
                '--pre-release',
                '--extensions-dir',
                extensionsDir,
                '--disable-telemetry'
            ],
            {
                encoding: 'utf-8',
                stdio: 'inherit'
            }
        );

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [TEMP_DIR, '--extensions-dir', extensionsDir],
            version: 'insiders'
        });
    } catch (err) {
        console.error('Failed to run tests', err);
        process.exit(1);
    } finally {
        dispose(disposables);
    }
}

main().catch((ex) => console.error('Unexpected error in running tests', ex));
