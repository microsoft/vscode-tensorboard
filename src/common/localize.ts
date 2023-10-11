// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { l10n } from 'vscode';

// Most messages are re-used, hence keep them in a single place and re-use.
export namespace Common {
    export const Yes = l10n.t('Yes');
    export const bannerLabelNo = l10n.t('No');
    export const doNotShowAgain = l10n.t("Don't show again");
}

export namespace Localized {
    export const OutputChannelName = l10n.t('Tensorboard');
    export const launchNativeTensorBoardSessionCodeLens = l10n.t('▶ Launch TensorBoard Session');
}

export namespace TensorBoard {
    export const enterRemoteUrl = l10n.t('Enter remote URL');
    export const enterRemoteUrlDetail = l10n.t(
        'Enter a URL pointing to a remote directory containing your TensorBoard log files'
    );
    export const useCurrentWorkingDirectoryDetail = l10n.t(
        'TensorBoard will search for tfevent files in all subdirectories of the current working directory'
    );
    export const useCurrentWorkingDirectory = l10n.t('Use current working directory');
    export const logDirectoryPrompt = l10n.t('Select a log directory to start TensorBoard with');
    export const progressMessage = l10n.t('Starting TensorBoard session...');
    export const nativeTensorBoardPrompt = l10n.t(
        'VS Code now has integrated TensorBoard support. Would you like to launch TensorBoard?  (Tip: Launch TensorBoard anytime by opening the command palette and searching for "Launch TensorBoard".)'
    );
    export const selectAFolder = l10n.t('Select a folder');
    export const selectAFolderDetail = l10n.t('Select a log directory containing tfevent files');
    export const selectAnotherFolder = l10n.t('Select another folder');
    export const selectAnotherFolderDetail = l10n.t('Use the file explorer to select another folder');
    export const installPrompt = l10n.t(
        'The package TensorBoard is required to launch a TensorBoard session. Would you like to install it?'
    );
    export const missingSourceFile = l10n.t(
        'The Python extension could not locate the requested source file on disk. Please manually specify the file.'
    );
    export const selectMissingSourceFile = l10n.t('Choose File');
    export const selectMissingSourceFileDescription = l10n.t(
        "The source file's contents may not match the original contents in the trace."
    );
}
