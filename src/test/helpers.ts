// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';
import * as fs from 'fs';
import { TEMP_DIR } from './constants';

export async function getExtensionsDir(): Promise<string> {
    const name = 'vscode_tensorboard_exts';
    const extDirPath = path.join(TEMP_DIR, name);
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR);
    }
    if (!fs.existsSync(extDirPath)) {
        fs.mkdirSync(extDirPath);
    }
    return extDirPath;
}
