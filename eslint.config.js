import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importX, { createNodeResolver } from 'eslint-plugin-import-x'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'design']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  {
    // The engine must stay runnable outside the browser (see src/engine/README.md).
    files: ['src/engine/**/*.ts'],
    languageOptions: { globals: {} },
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [createNodeResolver({ extensions: ['.ts', '.tsx', '.json'] })],
    },
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/engine',
              from: './src',
              except: ['./engine', './data/types.ts'],
              message: 'The engine may only import from itself and src/data/types.ts.',
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'react/*', 'react-dom', 'react-dom/*'],
              message: 'The engine must not depend on React.',
            },
            {
              group: ['@reduxjs/*', 'redux', 'react-redux', 'react-router', 'react-router/*'],
              message: 'The engine must not depend on state or routing libraries.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'localStorage', 'sessionStorage', 'fetch', 'navigator'].map(
          (name) => ({ name, message: 'The engine must not use browser APIs.' }),
        ),
      ],
    },
  },
  {
    // Engine tests may also read the committed chart; tests never ship with the engine.
    files: ['src/engine/**/*.test.ts'],
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/engine',
              from: './src',
              except: ['./engine', './data/types.ts', './data/typechart.json'],
              message:
                'Engine tests may only import from the engine, src/data/types.ts and src/data/typechart.json.',
            },
          ],
        },
      ],
    },
  },
])
