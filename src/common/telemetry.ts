// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import TelemetryReporter from '@vscode/extension-telemetry';
import { AppInsightsKey } from './constants';
import { disposableStore } from './lifecycle';
import { computeHash } from './crypto';
import { noop } from './utils';
import {
    EventName,
    TensorBoardEntrypoint,
    TensorBoardEntrypointTrigger,
    TensorBoardPromptSelection,
    TensorBoardSessionStartResult
} from '../constants';

// #region Telemetry

// #endregion

export interface IPropertyData {
    classification:
        | 'SystemMetaData'
        | 'CallstackOrException'
        | 'CustomerContent'
        | 'PublicNonPersonalData'
        | 'EndUserPseudonymizedInformation';
    purpose: 'PerformanceAndHealth' | 'FeatureInsight' | 'BusinessInsight';
    comment: string;
    expiration?: string;
    endpoint?: string;
    isMeasurement?: boolean;
}

export interface IGDPRProperty {
    owner: string;
    comment: string;
    expiration?: string;
    readonly [name: string]: IPropertyData | undefined | IGDPRProperty | string;
}

type IGDPRPropertyWithoutMetadata = Omit<IGDPRProperty, 'owner' | 'comment' | 'expiration'>;
export type OmitMetadata<T> = Omit<T, 'owner' | 'comment' | 'expiration'>;

export type ClassifiedEvent<T extends IGDPRPropertyWithoutMetadata> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [k in keyof T]: any;
};

export type StrictPropertyChecker<TEvent, TClassification, TError> =
    keyof TEvent extends keyof OmitMetadata<TClassification>
        ? keyof OmitMetadata<TClassification> extends keyof TEvent
            ? TEvent
            : TError
        : TError;

export type StrictPropertyCheckError = { error: 'Type of classified event does not match event properties' };

export type StrictPropertyCheck<T extends IGDPRProperty, E> = StrictPropertyChecker<
    E,
    ClassifiedEvent<OmitMetadata<T>>,
    StrictPropertyCheckError
>;

let telemetryReporter: TelemetryReporter;

/**
 * Send this & subsequent telemetry only after this promise has been resolved.
 * We have a default timeout of 30s.
 * @param {P[E]} [properties]
 * Can optionally contain a property `waitBeforeSending` referencing a promise.
 * Which must be awaited before sending the telemetry.
 */
export function publicLog2<E extends ClassifiedEvent<OmitMetadata<T>> = never, T extends IGDPRProperty = never>(
    eventName: string,
    data?: StrictPropertyCheck<T, E>
) {
    telemetryReporter = telemetryReporter
        ? telemetryReporter
        : disposableStore.add(new TelemetryReporter(AppInsightsKey));
    telemetryReporter.sendTelemetryEvent(eventName, data);
}

const urlsAndVersion = new Map<string, string>();
function getHostName(url: string) {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

interface TensorboardEntrypontTriggeredData {
    trigger: TensorBoardEntrypointTrigger;
    entrypoint: TensorBoardEntrypoint;
}
type TensorboardEntrypontTriggeredDataClassification = {
    owner: 'donjayamanne';
    comment: 'Codelens displayed';
    trigger: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Location where codelens was displayed';
    };
    entrypoint: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Code lens displayed';
    };
};
function stripPIIFromVersion(version: string) {
    const parts = version.split('.');
    if (parts.length < 2) {
        return 0;
    }
    return parseFloat(`${parseInt(parts[0], 10)}.${parseInt(parts[1], 10)}`);
}

/**
 * Safe way to send data in telemetry (obfuscate PII).
 */
export async function getTelemetrySafeHashedString(data: string) {
    return computeHash(data, 'SHA-256');
}

export function sendTensorboardEntrypointTriggered(
    trigger: TensorBoardEntrypointTrigger,
    entrypoint: TensorBoardEntrypoint
) {
    publicLog2<TensorboardEntrypontTriggeredData, TensorboardEntrypontTriggeredDataClassification>(
        EventName.TENSORBOARD_ENTRYPOINT_SHOWN,
        {
            trigger,
            entrypoint
        }
    );
}

interface TensorboardSelectionData {
    selection: TensorBoardPromptSelection;
}
type TensorboardSelectionDataClassification = {
    owner: 'donjayamanne';
    comment: 'Tensorboard prompt';
    selection: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Selection from the prompt';
    };
};
export function sendTensorboardPromptSelection(selection: TensorBoardPromptSelection) {
    publicLog2<TensorboardSelectionData, TensorboardSelectionDataClassification>(
        EventName.TENSORBOARD_INSTALL_PROMPT_SELECTION,
        {
            selection
        }
    );
}
interface TensorboardLaunchData {
    entrypoint: TensorBoardEntrypoint;
    trigger: TensorBoardEntrypointTrigger;
}
type TensorboardLaunchDataClassification = {
    owner: 'donjayamanne';
    comment: 'Tensorboard prompt';
    trigger: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Location where codelens was displayed';
    };
    entrypoint: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Code lens displayed';
    };
};
export function sendTensorboardLaunch(entrypoint: TensorBoardEntrypoint, trigger: TensorBoardEntrypointTrigger) {
    publicLog2<TensorboardLaunchData, TensorboardLaunchDataClassification>(EventName.TENSORBOARD_SESSION_LAUNCH, {
        trigger,
        entrypoint
    });
}

interface JumptToSourceData {}
type JumptToSourceDataClassification = {
    owner: 'donjayamanne';
    comment: 'Tensorboard jump to source';
};
export function sendJumptToSource() {
    publicLog2<JumptToSourceData, JumptToSourceDataClassification>(EventName.TENSORBOARD_JUMP_TO_SOURCE_REQUEST);
}
interface JumptToSourceSourceNotFoundData {}
type JumptToSourceSourceNotFoundDataClassification = {
    owner: 'donjayamanne';
    comment: 'Tensorboard jump to source';
};
export function sendJumptToSourceNotFound() {
    publicLog2<JumptToSourceSourceNotFoundData, JumptToSourceSourceNotFoundDataClassification>(
        EventName.TENSORBOARD_JUMP_TO_SOURCE_FILE_NOT_FOUND
    );
}

interface TensorboardDetectedInTerminalFoundData {}
type TensorboardDetectedInTerminalDataClassification = {
    owner: 'donjayamanne';
    comment: 'Tensorboard jump to source';
};
export function sendTensorboardDetectedInTerminal() {
    publicLog2<TensorboardDetectedInTerminalFoundData, TensorboardDetectedInTerminalDataClassification>(
        EventName.TENSORBOARD_JUMP_TO_SOURCE_FILE_NOT_FOUND
    );
}

interface TensorboardStartupData {
    result: TensorBoardSessionStartResult;
    duration: number;
}
type TensorboardStartupDataClassification = {
    owner: 'donjayamanne';
    comment: 'Codelens displayed';
    duration: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Duration to start tensorboard';
        isMeasurement: true;
    };
    result: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Result of starting tensorboard';
    };
};
export function sendTensorboardStartupResult(duration: number, result: TensorBoardSessionStartResult) {
    publicLog2<TensorboardStartupData, TensorboardStartupDataClassification>(
        EventName.TENSORBOARD_SESSION_DAEMON_STARTUP_DURATION,
        {
            duration,
            result
        }
    );
}

interface JupyterHubUrlNotAdded {
    failed: true;
    reason: 'cancel' | 'back' | 'error';
    lastStep:
        | ''
        | 'Before'
        | 'Get Url'
        | 'Get Username'
        | 'Get Password'
        | 'Verify Connection'
        | 'Get Display Name'
        | 'After';
}
type JupyterHubUrlNotAddedClassification = {
    owner: 'donjayamanne';
    comment: 'Url was not added';
    failed: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Indicator that adding the Url failed';
    };
    reason: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Reason for cancellation, back, cancel or error';
    };
    lastStep: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Last step the user took before exiting the workflow to add a url';
    };
};

export function sendJupyterHubUrlNotAdded(
    reason: 'cancel' | 'back' | 'error',
    lastStep:
        | ''
        | 'Before'
        | 'Get Url'
        | 'Get Username'
        | 'Get Password'
        | 'Verify Connection'
        | 'Get Display Name'
        | 'After'
) {
    publicLog2<JupyterHubUrlNotAdded, JupyterHubUrlNotAddedClassification>('addJupyterHubUrl', {
        failed: true,
        reason,
        lastStep
    });
}

interface JupyterHubTokenGeneratedUsingOldAPIData {
    hostNameHash: string;
    baseUrlHash: string;
}
type JupyterHubTokenGeneratedUsingOldAPIDataClassification = {
    owner: 'donjayamanne';
    comment: 'Sent when we generate API tokens using the old API';
    hostNameHash: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Hash of the host name of the server';
    };
    baseUrlHash: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Hash of the base url';
    };
};

export function trackUsageOfOldApiGeneration(baseUrl: string) {
    Promise.all([getTelemetrySafeHashedString(getHostName(baseUrl)), getTelemetrySafeHashedString(baseUrl)])
        .then(([hostNameHash, baseUrlHash]) => {
            publicLog2<JupyterHubTokenGeneratedUsingOldAPIData, JupyterHubTokenGeneratedUsingOldAPIDataClassification>(
                'generateTokenWithOldApi',
                {
                    hostNameHash,
                    baseUrlHash
                }
            );
        })
        .catch(noop);
}
interface JupyterHubUsage {}
type JupyterHubUsageClassification = {
    owner: 'donjayamanne';
    comment: 'Sent extension activates';
};

export function trackInstallOfExtension() {
    publicLog2<JupyterHubUsage, JupyterHubUsageClassification>('activated', {});
}

interface JupyterHubUrlCertProblemsSolutionData {
    solution: 'allow' | 'cancel';
    problem: 'self-signed' | 'expired';
}
type JupyterHubUrlCertProblemsSolutionDataClassification = {
    owner: 'donjayamanne';
    comment: 'Sent when user attempts to overcome a cert problem';
    problem: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'Problem with certificate';
    };
    solution: {
        classification: 'SystemMetaData';
        purpose: 'FeatureInsight';
        comment: 'How did user solve the cert problem did they allow usage of untrusted certs or cancel adding them';
    };
};

export function solveCertificateProblem(problem: 'self-signed' | 'expired', solution: 'allow' | 'cancel') {
    publicLog2<JupyterHubUrlCertProblemsSolutionData, JupyterHubUrlCertProblemsSolutionDataClassification>(
        'addJupyterHubUrlWithCertProblem',
        {
            solution,
            problem
        }
    );
}
