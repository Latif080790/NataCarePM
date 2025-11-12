/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    // Test environment
    environment: 'happy-dom',

    // Setup files
    setupFiles: ['./setupTests.ts'],

    // Global test APIs (no need to import describe, it, expect)
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/api/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
        'src/contexts/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
        'src/views/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/__fixtures__/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/setupTests.ts',
        'src/views/_archived/**',
      ],
      // Coverage thresholds (70% target for production readiness)
      // Gradually increase to 80%+ over time
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65, // Branches are typically harder to cover
        statements: 70,
        // Per-file thresholds (optional - enable for stricter enforcement)
        // perFile: true,
      },
      // Skip full coverage for test-only files
      skipFull: true,
      // Enable all available coverage reporters for CI/CD
      all: true,
    },

    // Test file patterns
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],

    // Timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter
    reporters: ['verbose', 'html'],

    // Watch mode
    watch: false,

    // Threads
    pool: 'threads',

    // Silent mode (set to false for debugging)
    silent: false,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
