// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { l10n } from 'vscode';

// Most messages are re-used, hence keep them in a single place and re-use.
export namespace Common {
    export const allow = l10n.t('Allow');
    export const seeInstructions = l10n.t('See Instructions');
    export const close = l10n.t('Close');
    export const bannerLabelYes = l10n.t('Yes');
    export const bannerLabelNo = l10n.t('No');
    export const canceled = l10n.t('Canceled');
    export const cancel = l10n.t('Cancel');
    export const ok = l10n.t('Ok');
    export const error = l10n.t('Error');
    export const gotIt = l10n.t('Got it!');
    export const install = l10n.t('Install');
    export const loadingExtension = l10n.t('Python extension loading...');
    export const openOutputPanel = l10n.t('Show output');
    export const noIWillDoItLater = l10n.t('No, I will do it later');
    export const notNow = l10n.t('Not now');
    export const doNotShowAgain = l10n.t("Don't show again");
    export const reload = l10n.t('Reload');
    export const moreInfo = l10n.t('More Info');
    export const learnMore = l10n.t('Learn more');
    export const and = l10n.t('and');
    export const reportThisIssue = l10n.t('Report this issue');
    export const recommended = l10n.t('Recommended');
    export const clearAll = l10n.t('Clear all');
    export const alwaysIgnore = l10n.t('Always Ignore');
    export const ignore = l10n.t('Ignore');
    export const selectPythonInterpreter = l10n.t('Select Python Interpreter');
    export const openLaunch = l10n.t('Open launch.json');
    export const useCommandPrompt = l10n.t('Use Command Prompt');
    export const download = l10n.t('Download');
    export const showLogs = l10n.t('Show logs');
    export const openFolder = l10n.t('Open Folder...');
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
    export const installTensorBoardAndProfilerPluginPrompt = l10n.t(
        'TensorBoard >= 2.4.1 and the PyTorch Profiler TensorBoard plugin >= 0.2.0 are required. Would you like to install these packages?'
    );
    export const installProfilerPluginPrompt = l10n.t(
        'We recommend installing version >= 0.2.0 of the PyTorch Profiler TensorBoard plugin. Would you like to install the package?'
    );
    export const upgradePrompt = l10n.t(
        'Integrated TensorBoard support is only available for TensorBoard >= 2.4.1. Would you like to upgrade your copy of TensorBoard?'
    );
    export const launchNativeTensorBoardSessionCodeLens = l10n.t('▶ Launch TensorBoard Session');
    export const launchNativeTensorBoardSessionCodeAction = l10n.t('Launch TensorBoard session');
    export const missingSourceFile = l10n.t(
        'The Python extension could not locate the requested source file on disk. Please manually specify the file.'
    );
    export const selectMissingSourceFile = l10n.t('Choose File');
    export const selectMissingSourceFileDescription = l10n.t(
        "The source file's contents may not match the original contents in the trace."
    );
}
