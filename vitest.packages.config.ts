import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["apps/**/test/**/*.test.{js,ts}", "packages/**/test/**/*.test.{js,ts}"],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
