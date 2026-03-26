# resolved_code_review_tk-172-cli-memory-provider-plugin-loader-cutover-and-dual-input-compatibility

- Status: resolved
- Date: 2026-03-26
- Task: `TK-172`
- Scope: `CLI memory provider loader / registry cutover / dual-input diagnostics`

## Review Summary

1. 确认 CLI 入口已通过统一 `MemoryProviderRegistry.loadProvider()` 同时承接 `storeEngine`、`provider.id` 与 `provider.module`。
2. 确认 `memory.provider.module` 成功路径会显式暴露 `memoryStoreResolutionSource=plugin_module` 与 `memoryStoreProviderModule`，不会继续伪装成 built-in 选择。
3. 确认 plugin 非 allowlist 模块保持 fail-closed，并以稳定 JSON error contract 对外暴露。

## Findings

1. 无待保留 finding。

## Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/examples/check-examples-smoke.js`
4. `pnpm run check`
