import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfig([
    globalIgnores(['dist/']),
    js.configs.recommended,
    stylistic.configs.customize({
        indent: 4,
        quotes: 'single',
        semi: false,
        commaDangle: 'never',
        braceStyle: '1tbs',
        jsx: false
    }),
    {
        rules: {
            '@stylistic/space-before-function-paren': ['error', 'always']
        }
    },
    {
        files: ['src/**/*.js', 'init.js'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.webextensions }
        }
    },
    {
        files: ['src/**/*.js'],
        languageOptions: {
            globals: { process: 'readonly', require: 'readonly' }
        }
    },
    {
        files: ['webpack.config.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: globals.node
        }
    }
])
