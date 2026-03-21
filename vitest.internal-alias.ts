import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Alias } from "vite";

const PROJECT_ROOT = fileURLToPath(new URL(".", import.meta.url));

const INTERNAL_PACKAGE_ENTRY_ALIASES = [
  ["@repo-ai-governor/adapter-sdk", "packages/adapter-sdk/src/index.ts"],
  ["@repo-ai-governor/adapter-claude-code", "packages/adapters/claude-code/src/index.ts"],
  ["@repo-ai-governor/adapter-codex", "packages/adapters/codex/src/index.ts"],
  ["@repo-ai-governor/adapter-github-copilot", "packages/adapters/github-copilot/src/index.ts"],
  ["@repo-ai-governor/artifact-registry", "packages/artifact-registry/src/index.ts"],
  ["@repo-ai-governor/cli", "apps/cli/src/main.ts"],
  ["@repo-ai-governor/config", "packages/config/src/index.ts"],
  ["@repo-ai-governor/core-change-risk", "packages/core-change-risk/src/index.ts"],
  ["@repo-ai-governor/core-memory", "packages/core-memory/src/index.ts"],
  ["@repo-ai-governor/core-policy", "packages/core-policy/src/index.ts"],
  ["@repo-ai-governor/core-process", "packages/core-process/src/index.ts"],
  ["@repo-ai-governor/core-role-registry", "packages/core-role-registry/src/index.ts"],
  ["@repo-ai-governor/core-runtime", "packages/core-runtime/src/index.ts"],
  ["@repo-ai-governor/core-session", "packages/core-session/src/index.ts"],
  ["@repo-ai-governor/memory-provider-fs-csv", "packages/memory-providers/fs-csv/src/index.ts"],
  [
    "@repo-ai-governor/memory-provider-sqlite-fs",
    "packages/memory-providers/sqlite-fs/src/index.ts",
  ],
  ["@repo-ai-governor/memory-store-adapter", "packages/memory-store-adapter/src/index.ts"],
  ["@repo-ai-governor/notification-dispatcher", "packages/notification-dispatcher/src/index.ts"],
  ["@repo-ai-governor/reporting", "packages/reporting/src/index.ts"],
  ["@repo-ai-governor/shared", "packages/shared/src/index.ts"],
  ["@repo-ai-governor/slots", "packages/slots/src/index.ts"],
  ["@repo-ai-governor/standards", "packages/standards/src/index.ts"],
] as const;

/**
 * Creates local source aliases for internal package specifiers in Vitest.
 * @returns Vite alias entries that map workspace package names to TypeScript sources.
 */
export function createVitestInternalAliases(): Alias[] {
  return INTERNAL_PACKAGE_ENTRY_ALIASES.map(([specifier, sourcePath]) => ({
    find: new RegExp(`^${specifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    replacement: resolve(PROJECT_ROOT, sourcePath),
  }));
}
