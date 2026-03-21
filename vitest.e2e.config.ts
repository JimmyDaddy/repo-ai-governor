import { defineConfig } from "vitest/config";
import { createVitestInternalAliases } from "./vitest.internal-alias.js";

export default defineConfig({
  resolve: {
    alias: createVitestInternalAliases(),
  },
  test: {
    globals: true,
    environment: "node",
    include: ["test/e2e/**/*.e2e.test.{js,ts}"],
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});
