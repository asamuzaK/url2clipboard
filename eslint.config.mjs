import importX from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import nounsanitized from 'eslint-plugin-no-unsanitized';
import regexp from 'eslint-plugin-regexp';
import unicorn from 'eslint-plugin-unicorn';
import neostandard, { plugins as neostdplugins } from 'neostandard';
import globals from 'globals';

export default [
  {
    ignores: ['src/js', 'src/lib', 'src/web-ext-config.cjs', '**/bundle/']
  },
  jsdoc.configs['flat/recommended'],
  nounsanitized.configs.recommended,
  regexp.configs['flat/recommended'],
  ...neostandard({
    semi: true
  }),
  {
    plugins: {
      '@stylistic': neostdplugins['@stylistic'],
      'import-x': importX,
      nounsanitized,
      regexp,
      unicorn
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.webextensions
      },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'always',
        asyncArrow: 'always',
        named: 'never'
      }],
      'import-x/order': ['error', {
        alphabetize: {
          order: 'ignore',
          caseInsensitive: false
        }
      }],
      'no-await-in-loop': 'error',
      'no-use-before-define': ['error', {
        allowNamedExports: false,
        classes: true,
        functions: true,
        variables: true
      }],
      'unicorn/prefer-node-protocol': 'error'
    }
  }
];
