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
  ["@repo-ai-governor/core-memory-semantics", "packages/core-memory-semantics/src/index.ts"],
  [
    "@repo-ai-governor/core-orchestration-service",
    "packages/core-orchestration-service/src/index.ts",
  ],
  ["@repo-ai-governor/core-policy", "packages/core-policy/src/index.ts"],
  ["@repo-ai-governor/core-process", "packages/core-process/src/index.ts"],
  ["@repo-ai-governor/core-role-registry", "packages/core-role-registry/src/index.ts"],
  ["@repo-ai-governor/core-runtime", "packages/core-runtime/src/index.ts"],
  ["@repo-ai-governor/core-runtime-langgraph", "packages/core-runtime-langgraph/src/index.ts"],
  [
    "@repo-ai-governor/core-runtime-langgraph/sqlite-fs-checkpointer",
    "packages/core-runtime-langgraph/src/sqlite-fs-checkpointer.ts",
  ],
  ["@repo-ai-governor/core-session", "packages/core-session/src/index.ts"],
  ["@repo-ai-governor/memory-provider-fs-csv", "packages/memory-providers/fs-csv/src/index.ts"],
  ["@repo-ai-governor/memory-provider-registry", "packages/memory-provider-registry/src/index.ts"],
  [
    "@repo-ai-governor/notification-provider-chat-im",
    "packages/notification-providers/chat-im/src/index.ts",
  ],
  [
    "@repo-ai-governor/notification-provider-webhook",
    "packages/notification-providers/webhook/src/index.ts",
  ],
  [
    "@repo-ai-governor/memory-provider-sqlite-fs",
    "packages/memory-providers/sqlite-fs/src/index.ts",
  ],
  ["@repo-ai-governor/memory-store-adapter", "packages/memory-store-adapter/src/index.ts"],
  ["@repo-ai-governor/notification-dispatcher", "packages/notification-dispatcher/src/index.ts"],
  [
    "@repo-ai-governor/orchestration-service-client",
    "packages/orchestration-service-client/src/index.ts",
  ],
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
