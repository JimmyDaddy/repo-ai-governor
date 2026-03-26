# TK-171 memory provider plugin allowlist 与 registry resolution contract baseline

- Status: planned
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-003-optional-plugin-mode-and-policy-hardening`

## 1. 任务目标

建立 optional plugin mode 的正式解析契约，冻结 allowlist / prefix / path / module policy，避免 `memory.provider.module` 演变成任意本地代码执行入口。

## 2. Depends On

1. `TK-170`
2. `DA-170`
3. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 3. 预期产物

1. plugin allowlist / prefix / path / module policy baseline。
2. plugin descriptor / resolution contract baseline。
3. fail-closed error contract 与测试同步。

## 4. Required Inputs

1. `packages/memory-provider-registry`
2. `packages/shared/src/types/interfaces/memory-runtime-config.interface.ts`
3. `packages/config/src/schema-validator.ts`
4. `DA-170`

## 5. Traceback References

1. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`
2. `DA-168`

## 6. 实施计划

1. 建立 plugin descriptor / allowlist registry 与 resolution path。
2. 冻结 `provider.module / exportName / options` 的 schema 与 fail-closed 语义。
3. 明确 prefix/path policy，禁止任意模块与未授权路径解析。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待 `DA-171`。
