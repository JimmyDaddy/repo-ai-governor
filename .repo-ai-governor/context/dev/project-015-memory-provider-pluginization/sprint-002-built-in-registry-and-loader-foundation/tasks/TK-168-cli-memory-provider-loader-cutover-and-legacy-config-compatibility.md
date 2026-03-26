# TK-168 CLI memory provider loader cutover 与 legacy config 兼容

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-002-built-in-registry-and-loader-foundation`

## 1. 任务目标

把 CLI 的 memory provider 组合逻辑切到统一 loader，同时保持现有 `storeEngine` 的兼容语义，避免目标仓库配置断裂。

## 2. Depends On

1. `TK-167`
2. `DA-159`
3. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 3. 预期产物

1. CLI loader cutover baseline。
2. legacy `storeEngine` compatibility baseline。
3. diagnostics / tests / docs 同步。

## 4. Required Inputs

1. `apps/cli/src/main.ts`
2. `packages/config/src/schema-validator.ts`
3. `packages/shared/src/types/interfaces/memory-runtime-config.interface.ts`
4. `TK-167`

## 5. Traceback References

1. `DA-159`
2. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 6. 实施计划

1. 将 `composeMemoryStoreProvider()` 迁移到 loader 消费路径。
2. 保持 `storeEngine` 快捷配置兼容，同时为后续 `provider.id/module` 留出扩展位。
3. 补齐 CLI 侧 diagnostics 与回归。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始把 CLI memory provider 组合逻辑收敛到 registry loader，并扩展 legacy `storeEngine` 兼容面。
3. 2026-03-26：任务完成，已新增 `memory.provider.id` / `provider.module` 契约槽位、将 CLI diagnostics 对齐到 loader 输出，并保持 legacy `storeEngine` 兼容。

## 10. 产出

1. [DA-168](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-002-built-in-registry-and-loader-foundation/tasks/DA-168-cli-memory-provider-loader-cutover-and-legacy-config-compatibility.md)
