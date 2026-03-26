# resolved_code_review_tk-171-memory-provider-plugin-allowlist-and-registry-resolution-contract-baseline

- Status: resolved
- Date: 2026-03-26
- Task: `TK-171`
- Scope: `memory-provider-registry plugin policy / config schema / resolution contract`

## Review Summary

1. 确认 `memory-provider-registry` 已建立 optional plugin baseline 的 allowlist / prefix / path / module policy，不再把 `provider.module` 留作未定义扩展槽位。
2. 确认 plugin path 采用 factory contract 和 resolution source contract，而不是把任意 module 直接塞进 built-in loader。
3. 确认 `schema-validator` 对 `provider.id + provider.module` 混用、无 `module` 的 `exportName/options`、以及非 bare package specifier 都采用 fail-closed 校验。

## Findings

1. 无待保留 finding。

## Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts packages/config/test/config.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`
