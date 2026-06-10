const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: ['node_modules/', 'test-results/', 'playwright-report/', '.playwright-mcp/', '.lighthouseci/'],
    },
    js.configs.recommended,
    {
        // Browser scripts; books.js also runs under Node for unit tests,
        // hence the commonjs globals (module is referenced behind a guard)
        files: ['js/**/*.js'],
        languageOptions: {
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.commonjs,
            },
        },
    },
    {
        files: ['test/**/*.js', 'e2e/**/*.js', 'scripts/**/*.js', '*.config.js', 'lighthouserc.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
    },
];
