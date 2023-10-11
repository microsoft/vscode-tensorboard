// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FileSystemWatcher, RelativePattern, WorkspaceFolder, WorkspaceFoldersChangeEvent, workspace } from 'vscode';
import { TensorBoardPrompt } from './tensorBoardPrompt';
import { BaseDisposable } from './common/lifecycle';
import { TensorBoardEntrypointTrigger } from './constants';

export class TensorBoardFileWatcher extends BaseDisposable {
    public readonly supportedWorkspaceTypes = { untrustedWorkspace: false, virtualWorkspace: false };

    private fileSystemWatchers = new Map<WorkspaceFolder, FileSystemWatcher[]>();

    private globPatterns = ['*tfevents*', '*/*tfevents*', '*/*/*tfevents*'];

    constructor() {
        super();
        this.activateInternal();
    }

    private activateInternal() {
        const folders = workspace.workspaceFolders;
        if (!folders) {
            return;
        }

        // If the user creates or changes tfevent files, listen for those too
        for (const folder of folders) {
            this.createFileSystemWatcher(folder);
        }

        // If workspace folders change, ensure we update our FileSystemWatchers
        this._register(workspace.onDidChangeWorkspaceFolders((e) => this.updateFileSystemWatchers(e)));
    }

    private async updateFileSystemWatchers(event: WorkspaceFoldersChangeEvent) {
        for (const added of event.added) {
            this.createFileSystemWatcher(added);
        }
        for (const removed of event.removed) {
            const fileSystemWatchers = this.fileSystemWatchers.get(removed);
            if (fileSystemWatchers) {
                fileSystemWatchers.forEach((fileWatcher) => fileWatcher.dispose());
                this.fileSystemWatchers.delete(removed);
            }
        }
    }

    private createFileSystemWatcher(folder: WorkspaceFolder) {
        const fileWatchers = [];
        for (const pattern of this.globPatterns) {
            const relativePattern = new RelativePattern(folder, pattern);
            const fileSystemWatcher = workspace.createFileSystemWatcher(relativePattern);

            // When a file is created or changed that matches `this.globPattern`, try to show our prompt
            this._register(
                fileSystemWatcher.onDidCreate(() =>
                    TensorBoardPrompt.showNativeTensorBoardPrompt(TensorBoardEntrypointTrigger.tfeventfiles)
                )
            );
            this._register(
                fileSystemWatcher.onDidChange(() =>
                    TensorBoardPrompt.showNativeTensorBoardPrompt(TensorBoardEntrypointTrigger.tfeventfiles)
                )
            );
            this._register(fileSystemWatcher);
            fileWatchers.push(fileSystemWatcher);
        }
        this.fileSystemWatchers.set(folder, fileWatchers);
    }
}
