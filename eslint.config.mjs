import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  pluginJs.configs.recommended,
  {
    files: [
      'eslint.config.mjs',
      'src/*.js',
    ],
    rules: {
      'array-bracket-spacing': [
        'error',
        'always',
      ],
      'comma-dangle': [
        'error',
        'always-multiline',
      ],
      'comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],
      indent: [
        'error',
        2,
      ],
      'key-spacing': [
        'error',
        { afterColon: true },
      ],
      'linebreak-style': [
        'error',
        'unix',
      ],
      'no-constant-condition': [
        'off',
      ],
      'no-trailing-spaces': [
        'error',
      ],
      'object-curly-spacing': [
        'error',
        'always',
      ],
      quotes: [
        'error',
        'single',
      ],
      'quote-props': [
        'error',
        'as-needed',
      ],
      semi: [
        'error',
        'always',
      ],
      'space-in-parens': [
        'error',
        'never',
      ],
    },
    languageOptions: { globals: globals.node },
  },
];