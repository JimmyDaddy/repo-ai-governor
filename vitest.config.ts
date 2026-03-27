import { defineConfig } from 'vitest/config';
import { createVitestInternalAliases } from './vitest.internal-alias.js';

export default defineConfig({
  resolve: {
    alias: createVitestInternalAliases(),
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'apps/**/test/**/*.test.{js,ts}',
      'packages/**/test/**/*.test.{js,ts}',
      'test/**/*.test.{js,ts}',
    ],
    testTimeout: 60000,
    hookTimeout: 60000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['apps/**/*.ts', 'packages/**/*.ts', 'bin/**/*.ts', 'src/**/*.ts'],
      exclude: ['**/test/**', '**/*.test.ts', '**/*.test.js', 'dist/**'],
    },
  },
});
