// Lint rules for the whole repo: catches unused code and React hook mistakes; Prettier owns formatting.
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {ignores: ['**/node_modules/**', '**/dist/**', 'deploy/**']},
  js.configs.recommended,
  {
    languageOptions: {ecmaVersion: 'latest', sourceType: 'module', globals: {...globals.node}},
    rules: {
      'no-unused-vars': [
        'error',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true},
      ],
    },
  },
  {
    files: ['apps/web/**/*.{js,jsx}'],
    plugins: {react, 'react-hooks': reactHooks},
    languageOptions: {globals: {...globals.browser}, parserOptions: {ecmaFeatures: {jsx: true}}},
    settings: {react: {version: 'detect'}},
    rules: {
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
];
