import jsdoc from 'eslint-plugin-jsdoc';
import nounsanitized from 'eslint-plugin-no-unsanitized';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import regexp from 'eslint-plugin-regexp';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import neostandard from 'neostandard';

export default [
  ...neostandard({
    noStyle: true
  }),
  jsdoc.configs['flat/recommended'],
  regexp.configs['flat/recommended'],
  prettierRecommended,
  {
    ignores: ['bundle/', 'src/lib/', 'src/web-ext-config.cjs', '**/*.min.js']
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.webextensions
      },
      ecmaVersion: 'latest'
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    plugins: {
      nounsanitized,
      regexp,
      unicorn
    },
    settings: {
      jsdoc: {
        mode: 'typescript'
      }
    },
    rules: {
      curly: ['error', 'all'],
      'jsdoc/no-undefined-types': [
        'error',
        {
          definedTypes: ['ReadonlyArray']
        }
      ],
      'no-await-in-loop': 'error',
      'no-use-before-define': [
        'error',
        {
          allowNamedExports: false,
          classes: true,
          functions: true,
          variables: true
        }
      ],
      'prefer-object-has-own': 'error',
      'unicorn/prefer-node-protocol': 'error'
    }
  }
];
