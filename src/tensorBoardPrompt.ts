// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Memento, commands, window } from 'vscode';
import { Common, TensorBoard } from './common/localize';
import { Commands, TensorBoardEntrypoint, TensorBoardEntrypointTrigger, TensorBoardPromptSelection } from './constants';
import { sendTensorboardEntrypointTriggered, sendTensorboardPromptSelection } from './common/telemetry';
enum TensorBoardPromptStateKeys {
    ShowNativeTensorBoardPrompt = 'showNativeTensorBoardPrompt'
}

export class TensorBoardPrompt {
    private enabledInCurrentSession = true;

    private waitingForUserSelection = false;
    private telementrSent = false;
    private sendTelemetryOnce(trigger: TensorBoardEntrypointTrigger) {
        if (this.telementrSent) {
            return;
        }
        this.telementrSent = true;
        sendTensorboardEntrypointTriggered(trigger, TensorBoardEntrypoint.prompt);
    }

    constructor(private readonly globalMmento: Memento) {}

    public async showNativeTensorBoardPrompt(trigger: TensorBoardEntrypointTrigger): Promise<void> {
        if (this.isPromptEnabled() && this.enabledInCurrentSession && !this.waitingForUserSelection) {
            const yes = Common.bannerLabelYes;
            const no = Common.bannerLabelNo;
            const doNotAskAgain = Common.doNotShowAgain;
            const options = [yes, no, doNotAskAgain];
            this.waitingForUserSelection = true;
            this.sendTelemetryOnce(trigger);
            const selection = await window.showInformationMessage(TensorBoard.nativeTensorBoardPrompt, ...options);
            this.waitingForUserSelection = false;
            this.enabledInCurrentSession = false;
            let telemetrySelection = TensorBoardPromptSelection.None;
            switch (selection) {
                case yes:
                    telemetrySelection = TensorBoardPromptSelection.Yes;
                    await commands.executeCommand(Commands.LaunchTensorBoard, TensorBoardEntrypoint.prompt, trigger);
                    break;
                case doNotAskAgain:
                    telemetrySelection = TensorBoardPromptSelection.DoNotAskAgain;
                    await this.disablePrompt();
                    break;
                case no:
                    telemetrySelection = TensorBoardPromptSelection.No;
                    break;
                default:
                    break;
            }
            sendTensorboardPromptSelection(telemetrySelection);
        }
    }

    private isPromptEnabled(): boolean {
        return this.globalMmento.get<boolean>(TensorBoardPromptStateKeys.ShowNativeTensorBoardPrompt, true);
    }

    private async disablePrompt() {
        await this.globalMmento.update(TensorBoardPromptStateKeys.ShowNativeTensorBoardPrompt, false);
    }
}
