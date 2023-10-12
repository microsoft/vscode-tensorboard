// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { commands, window } from 'vscode';
import { Common, TensorBoard } from './common/localize';
import {
    Commands,
    ExtensionInfo,
    TensorBoardEntrypoint,
    TensorBoardEntrypointTrigger,
    TensorBoardPromptSelection
} from './constants';
import { sendTensorboardEntrypointTriggered, sendTensorboardPromptSelection } from './common/telemetry';
import { PrivatePythonApiProvider } from './pythonApi';
import { traceDebug } from './common/logging';
import { hasFileBasedWorkspace } from './helpers';
enum TensorBoardPromptStateKeys {
    ShowNativeTensorBoardPrompt = 'showNativeTensorBoardPrompt'
}

export namespace TensorBoardPrompt {
    let enabledInCurrentSession = true;
    let waitingForUserSelection = false;
    const telementrSentForTrigger: TensorBoardEntrypointTrigger[] = [];
    function sendTelemetryOnce(trigger: TensorBoardEntrypointTrigger) {
        if (telementrSentForTrigger.includes(trigger)) {
            return;
        }
        telementrSentForTrigger.push(trigger);
        sendTensorboardEntrypointTriggered(trigger, TensorBoardEntrypoint.prompt);
    }

    export async function show(trigger: TensorBoardEntrypointTrigger): Promise<void> {
        if (!enabledInCurrentSession || waitingForUserSelection) {
            return;
        }
        if (!(await isPromptEnabled())) {
            return;
        }
        const yes = Common.Yes;
        const no = Common.bannerLabelNo;
        const doNotAskAgain = Common.doNotShowAgain;
        const options = [yes, no, doNotAskAgain];
        waitingForUserSelection = true;
        enabledInCurrentSession = false;
        sendTelemetryOnce(trigger);
        const selection = await window.showInformationMessage(TensorBoard.nativeTensorBoardPrompt, ...options);
        waitingForUserSelection = false;
        let telemetrySelection = TensorBoardPromptSelection.None;
        switch (selection) {
            case yes:
                telemetrySelection = TensorBoardPromptSelection.Yes;
                await commands.executeCommand(Commands.LaunchTensorBoard, TensorBoardEntrypoint.prompt, trigger);
                break;
            case doNotAskAgain:
                telemetrySelection = TensorBoardPromptSelection.DoNotAskAgain;
                await disablePrompt();
                break;
            case no:
                telemetrySelection = TensorBoardPromptSelection.No;
                break;
            default:
                break;
        }
        sendTensorboardPromptSelection(telemetrySelection);
    }

    async function isPromptEnabled(): Promise<boolean> {
        // Prompts are enabled, only if we have at least one worksapce thats a real file system with python
        // Or no workspaces at all.
        if (!hasFileBasedWorkspace()) {
            traceDebug('TensorBoard prompt is disabled as there are no workspace folders that are file system based');
            return false;
        }
        const pythonApi = await PrivatePythonApiProvider.instance.getApi();
        return (
            pythonApi.isPromptEnabled() &&
            ExtensionInfo.context.globalState.get<boolean>(TensorBoardPromptStateKeys.ShowNativeTensorBoardPrompt, true)
        );
    }

    async function disablePrompt() {
        await ExtensionInfo.context.globalState.update(TensorBoardPromptStateKeys.ShowNativeTensorBoardPrompt, false);
    }
}
