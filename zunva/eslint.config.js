import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/playwright-report/**', '**/test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.{js,ts}', 'apps/web/*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  // Luật hướng phụ thuộc: lõi không biết gì về giao diện, trình duyệt hay các gói khác.
  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-dom'],
          patterns: ['react-dom/*', '@zunva/platform', '@zunva/platform/*', '@zunva/tools', '@zunva/tools/*'],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'sessionStorage', 'navigator'],
    },
  },
  {
    files: ['packages/platform/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: ['react', 'react-dom'], patterns: ['react-dom/*', '@zunva/tools', '@zunva/tools/*'] },
      ],
    },
  },
);
