# resolved_code_review_tk-168-cli-memory-provider-loader-cutover-and-legacy-config-compatibility

- Status: resolved
- Date: 2026-03-26
- Task: `TK-168`
- Scope: `CLI memory provider loader cutover / legacy config compatibility / diagnostics`

## Review Summary

1. 确认 CLI 已不再在入口层直接决定 memory provider 实现，而是统一消费 `MemoryProviderRegistry`。
2. 确认 `storeEngine` 兼容语义保持成立，同时新增 `memory.provider.id` 作为 built-in 显式声明槽位。
3. 确认 `memory.provider.module` 当前未被提前开放，并以 fail-closed 方式阻断 future plugin 语义提前泄漏到 `sprint-002`。
4. 确认 CLI diagnostics 与 config/schema/shared contract 已同步到 loader 输出的事实源。

## Findings

1. 无待保留 finding。

## Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`
