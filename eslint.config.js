const { fixupConfigRules } = require('@eslint/compat');
const { FlatCompat } = require('@eslint/eslintrc');

require('eslint-plugin-header').rules.header.meta.schema = [
    { enum: ['block', 'line'] },
    { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
    { type: 'integer', minimum: 0 }
];

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = fixupConfigRules(compat.config(require('./.eslintrc')));
