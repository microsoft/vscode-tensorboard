// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
    target: 'node',
    mode: 'none',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    externals: [
        'vscode',
        'commonjs',
        '@opentelemetry/tracing',
        // Ignore telemetry specific packages that are not required.
        'applicationinsights-native-metrics',
        '@azure/functions-core',
        '@azure/opentelemetry-instrumentation-azure-sdk',
        '@opentelemetry/instrumentation'
    ],
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    devtool: 'nosources-source-map',
    infrastructureLogging: {
        level: 'log' // enables logging required for problem matchers
    }
};
module.exports = [extensionConfig];
