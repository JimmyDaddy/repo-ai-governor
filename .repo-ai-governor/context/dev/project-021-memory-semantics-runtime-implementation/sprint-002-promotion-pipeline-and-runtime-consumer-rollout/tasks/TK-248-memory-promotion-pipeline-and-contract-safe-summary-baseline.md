# TK-248 memory promotion pipeline 与 contract-safe summary baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-002-promotion-pipeline-and-runtime-consumer-rollout`

## 1. 任务目标

在 `core-memory-semantics` 当前 recall/context assembly baseline 之上，建立显式、可审计的 memory promotion pipeline，并补齐 machine-readable 的 contract-safe summary 输出。

## 2. Depends On

1. `TK-244`
2. `DA-245`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`

## 3. 预期产物

1. `packages/core-memory-semantics/**` 中的 promotion pipeline/service baseline。
2. 明确的 contract-safe summary shape 或相关 contract 对应实现。
3. 相关 package / integration tests。
4. `DA-248`

## 4. 实施计划

1. 盘点当前 recall/context assembly 输出边界，定位可复用的 promotion touchpoints。
2. 引入显式 promotion steps 与 machine-readable summary，保持 audit-friendly。
3. 更新测试，确保不回退到 raw snapshot shape 或 canonical source rewrite。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s tsc -p tsconfig.build.json`
3. `pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始盘点 `core-memory-semantics` recall/context assembly 的输出边界与候选 promotion touchpoints，准备收敛 contract-safe summary contract。
3. 2026-03-27：已完成 `MemoryPromotionService`、`contractSafeSummary`、CLI runtime 回归断言与 `DA-248`，并通过目标 `tsc` / `vitest` / `pnpm run check`。
