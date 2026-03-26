# TK-167 memory provider registry package 与 built-in descriptor 契约基线

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-002-built-in-registry-and-loader-foundation`

## 1. 任务目标

建立 memory provider registry / loader 的正式落点，并冻结 `fs-csv`、`sqlite-fs` 的 built-in descriptor 契约，避免 CLI 入口继续直接持有 provider 选择逻辑。

## 2. Depends On

1. `TK-159`
2. `DA-159`
3. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 3. 预期产物

1. memory provider registry / loader baseline。
2. built-in provider descriptor contract。
3. package boundary 与 README / task ledger 同步。

## 4. Required Inputs

1. `apps/cli/src/main.ts`
2. `packages/shared/src/constants/memory-store.constant.ts`
3. `packages/shared/src/types/interfaces/memory-runtime-config.interface.ts`
4. `packages/memory-store-adapter/src/types/interfaces/memory-store.interface.ts`
5. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 5. Traceback References

1. `DA-159`
2. `DA-160`

## 6. 实施计划

1. 确定 registry / loader 应收敛到的 package 边界与导出形态。
2. 为 built-in provider descriptor 建立稳定 contract，覆盖 `fs-csv` 与 `sqlite-fs`。
3. 为 `TK-168/TK-169` 冻结可消费的 loader 输入/输出契约。
4. 同步 `dist/runtime` 与 local distribution 校验，使新 registry package 成为正式 runtime asset。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/runtime/orchestration-service-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始建立 registry / loader 与 built-in descriptor 的基线边界。
3. 2026-03-26：新增 `@repo-ai-governor/memory-provider-registry`，冻结 `fs-csv/sqlite-fs` built-in descriptor contract，CLI 入口改为通过 registry loader 解析 provider，并同步 runtime asset copy 与 local distribution 校验。
4. 2026-03-26：验证通过 `pnpm -s tsc -p tsconfig.json --noEmit`、`pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`。

## 10. 产出

1. [DA-167](./DA-167-memory-provider-registry-package-and-built-in-descriptor-contract-baseline.md)
