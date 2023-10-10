// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Event } from 'vscode';

export const ITensorBoardImportTracker = Symbol('ITensorBoardImportTracker');
export interface ITensorBoardImportTracker {
    onDidImportTensorBoard: Event<void>;
}
