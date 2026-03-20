import { defineConfig } from "vitest/config";
import { createVitestInternalAliases } from "./vitest.internal-alias.js";

export default defineConfig({
  resolve: {
    alias: createVitestInternalAliases(),
  },
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.{js,ts}"],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
