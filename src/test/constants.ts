// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';

export const EXTENSION_DIR = path.join(__dirname, '..', '..');
export const TEMP_DIR = path.join(EXTENSION_DIR, 'tmp');
export const CI_PYTHON_PATH = process.env.CI_PYTHON_PATH || 'python';
