// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Appropriately formats a string so it can be used as an argument for a command in a shell.
 * E.g. if an argument contains a space, then it will be enclosed within double quotes.
 * @param {String} value.
 */
export function toCommandArgument(value: string): string {
    if (!value) {
        return value;
    }
    return (value.indexOf(' ') >= 0 || value.indexOf('&') >= 0 || value.indexOf('(') >= 0 || value.indexOf(')') >= 0) &&
        !value.startsWith('"') &&
        !value.endsWith('"')
        ? `"${value}"`
        : value.toString();
}

/**
 * Appropriately formats a a file path so it can be used as an argument for a command in a shell.
 * E.g. if an argument contains a space, then it will be enclosed within double quotes.
 */
export function fileToCommandArgument(value: string): string {
    if (!value) {
        return value;
    }
    return toCommandArgument(value).replace(/\\/g, '/');
}

/**
 * String.trimQuotes implementation
 * Removes leading and trailing quotes from a string
 */
export function trimQuotes(this: string): string {
    if (!this) {
        return this;
    }
    return this.replace(/(^['"])|(['"]$)/g, '');
}
