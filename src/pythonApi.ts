// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { EventEmitter, Uri, extensions, workspace } from 'vscode';
import { createDeferred } from './common/async';
import { PythonExtensionId } from './constants';
import { traceError } from './common/logging';
import { noop } from './common/utils';
import { PythonExtensionChecker } from './pythonExtensionChecker';
import { BaseDisposable } from './common/lifecycle';

export interface PrivatePythonApi {
    /**
     * Gets activated env vars for the active Python Environment for the given resource.
     */
    getActivatedEnvironmentVariables(resource: Uri | undefined): Promise<NodeJS.ProcessEnv | undefined>;
    /**
     * Ensures that the dependencies required for TensorBoard are installed in Active Environment for the given resource.
     */
    ensureDependenciesAreInstalled(resource?: Uri): Promise<boolean>;
    /**
     * Whether to allow displaying tensorboard prompt.
     */
    isPromptEnabled(): boolean;
}

export class PrivatePythonApiProvider extends BaseDisposable {
    private readonly api = createDeferred<PrivatePythonApi>();
    private readonly didActivatePython = this._register(new EventEmitter<void>());
    private readonly _pythonExtensionHooked = createDeferred<void>();
    public get onDidActivatePythonExtension() {
        return this.didActivatePython.event;
    }

    // This promise will resolve when the python extension is hooked
    public get pythonExtensionHooked(): Promise<void> {
        return this._pythonExtensionHooked.promise;
    }

    private initialized?: boolean;
    private hooksRegistered?: boolean;
    private readonly extensionChecker = this._register(new PythonExtensionChecker());
    private static _instance: PrivatePythonApiProvider;
    public static get instance() {
        return (
            PrivatePythonApiProvider._instance || (PrivatePythonApiProvider._instance = new PrivatePythonApiProvider())
        );
    }
    private constructor() {
        super();
        const previouslyInstalled = this.extensionChecker.isPythonExtensionInstalled;
        if (!previouslyInstalled) {
            this._register(
                extensions.onDidChange(async () => {
                    if (this.extensionChecker.isPythonExtensionInstalled) {
                        await this.registerHooks();
                    }
                }, this)
            );
        }
    }

    public getApi(): Promise<PrivatePythonApi> {
        this.init().catch(noop);
        return this.api.promise;
    }

    public registerPythonApi(api: PrivatePythonApi): void {
        // Never allow accessing python API (we don't want to ever use the API and run code in untrusted API).
        // Don't assume Python API will always be disabled in untrusted workspaces.
        if (this.api.resolved || !workspace.isTrusted) {
            return;
        }
        this.api.resolve(api);
    }

    private async init() {
        if (this.initialized) {
            return;
        }
        const pythonExtension = extensions.getExtension<{ tensorboard: { registerHooks(): void } }>(PythonExtensionId);
        if (!pythonExtension) {
            await this.extensionChecker.showPythonExtensionInstallRequiredPrompt();
        } else {
            await this.registerHooks();
        }
        this.initialized = true;
    }
    private async registerHooks() {
        if (this.hooksRegistered) {
            return;
        }
        const pythonExtension = extensions.getExtension<{ tensorboard: { registerHooks(): void } }>(PythonExtensionId);
        if (!pythonExtension) {
            return;
        }
        let activated = false;
        if (!pythonExtension.isActive) {
            try {
                await pythonExtension.activate();
                activated = true;
            } catch (ex) {
                traceError(`Failed activating the python extension: `, ex);
                this.api.reject(new Error('Python Extnsion failed to actiavte'));
                return;
            }
        }
        if (this.hooksRegistered) {
            return;
        }
        this.hooksRegistered = true;
        if (activated) {
            this.didActivatePython.fire();
        }
        if (!pythonExtension.exports?.tensorboard) {
            traceError(`Python extension is not exporting the jupyter API`);
            this.api.reject(new Error('Python Extnsion does not expose the required API'));
        } else {
            pythonExtension.exports.tensorboard.registerHooks();
        }
        this._pythonExtensionHooked.resolve();
    }
}
