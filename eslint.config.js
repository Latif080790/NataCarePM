// ESLint Configuration for NataCarePM
// Modern ESLint 9.x configuration with TypeScript support

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  // Ignore patterns first
  {
    ignores: [
      'dist/',
      'node_modules/',
      'build/',
      'coverage/',
      '*.d.ts',
      '.firebase/',
      'firebase-debug.log',
      'firestore-debug.log',
      'mockData.ts',
    ],
  },
  
  // JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'complexity': ['warn', 15],
    },
  },
  
  // TypeScript files  
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Disable conflicting base rules
      'no-unused-vars': 'off',
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'complexity': ['warn', 15],
    },
  },
  
  // Test files - more relaxed rules
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
      'complexity': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  
  // Configuration and setup files
  {
    files: [
      'vite.config.ts', 
      'jest.config.js', 
      'eslint.config.js',
      'setup*.js',
      'create*.js',
      'firebase*.js',
      'get-*.js',
      'update*.js',
      'test-*.js'
    ],
    rules: {
      'no-console': 'off',
      'complexity': 'off',
    },
  },
];