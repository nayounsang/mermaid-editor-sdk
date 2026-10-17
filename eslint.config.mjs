import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from 'typescript-eslint';

const exportedApiContexts = [
  'ExportNamedDeclaration > FunctionDeclaration',
  'ExportDefaultDeclaration > FunctionDeclaration',
  'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
  'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression',
  'ExportDefaultDeclaration > ArrowFunctionExpression',
  'ExportNamedDeclaration > ClassDeclaration > ClassBody > MethodDefinition',
  'ExportDefaultDeclaration > ClassDeclaration > ClassBody > MethodDefinition',
];

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**', 'node_modules/**']),
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  {
    files: [
      'package/headless/src/**/*.{ts,tsx}',
      'package/ui/src/**/*.{ts,tsx}',
    ],
    plugins: { jsdoc },
    settings: { jsdoc: { mode: 'typescript' } },
    rules: {
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-param': ['error', {
        contexts: exportedApiContexts,
        enableFixer: false,
        interfaceExemptsParamsCheck: true,
      }],
      'jsdoc/require-param-description': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-types': 'error',
    },
  },
]);
