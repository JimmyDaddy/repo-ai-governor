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
      'packages/**/test/**/*.contract.test.{js,ts}',
      'test/contract/**/*.contract.test.{js,ts}',
    ],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
