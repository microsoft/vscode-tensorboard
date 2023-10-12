// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IDisposable {
    dispose(): void;
}

function isIterable<T = any>(thing: any): thing is Iterable<T> {
    return thing && typeof thing === 'object' && typeof thing[Symbol.iterator] === 'function';
}

/**
 * Disposes of the value(s) passed in.
 */
export function dispose<T extends IDisposable>(disposable: T): T;
export function dispose<T extends IDisposable>(disposable: T | undefined): T | undefined;
export function dispose<T extends IDisposable>(disposables: Array<T>): Array<T>;
export function dispose<T extends IDisposable>(disposables: ReadonlyArray<T>): ReadonlyArray<T>;
export function dispose<T extends IDisposable>(arg: T | Array<T> | ReadonlyArray<T> | undefined): any {
    if (isIterable(arg)) {
        for (const d of arg) {
            if (d) {
                try {
                    d.dispose();
                } catch {
                    //
                }
            }
        }
    } else if (arg) {
        try {
            arg.dispose();
        } catch {
            //
        }
    }
}

export class DisposableStore {
    private _disposables: IDisposable[] = [];
    protected get disposables() {
        return this._disposables;
    }
    add<T extends IDisposable>(disposable: T) {
        this.disposables.push(disposable);
        return disposable;
    }
    dispose() {
        dispose(this.disposables);
        this._disposables = [];
    }
}

/**
 * Abstract base class for a {@link IDisposable disposable} object.
 *
 * Subclasses can {@linkcode _register} disposables that will be automatically cleaned up when this object is disposed of.
 */
export abstract class BaseDisposable implements IDisposable {
    protected readonly _store = new DisposableStore();

    public dispose(): void {
        this._store.dispose();
    }

    /**
     * Adds `o` to the collection of disposables managed by this object.
     */
    protected _register<T extends IDisposable>(o: T): T {
        return this._store.add(o);
    }
}
export const disposableStore = new DisposableStore();
