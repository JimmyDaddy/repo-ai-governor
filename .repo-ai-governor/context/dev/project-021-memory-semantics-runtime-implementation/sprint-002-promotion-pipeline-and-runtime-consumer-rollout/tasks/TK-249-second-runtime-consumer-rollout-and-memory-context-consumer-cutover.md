# TK-249 second runtime consumer rollout 与 memory-context consumer cutover

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-021-memory-semantics-runtime-implementation`
- Sprint: `sprint-002-promotion-pipeline-and-runtime-consumer-rollout`

## 1. 任务目标

将第二个 runtime consumer 切到 `runtime.memory-semantics`，并确保它只消费 `memoryContext` 或 contract-safe summary，而不是重新暴露 `layeredSnapshot`。

## 2. Depends On

1. `TK-248`
2. `DA-244`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 3. 预期产物

1. 第二 consumer 的 cutover 实现与测试。
2. rollout truth 回填到相关 plan / artifact / delivery handoff 事实面。
3. `DA-249`

## 4. 实施计划

1. 选择非当前 CLI task-driven path 的第二 consumer。
2. 将其切到 `memoryContext` 或 contract-safe summary。
3. 验证 consumer rollout 不引入 raw snapshot leakage。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run <targeted-consumer-tests> --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始收敛第二个 runtime consumer，优先评估 `CliGovernanceRuntime` 的 assembly check 是否可以从 `memoryRecall.resultSummary` 切到 `memoryContext.contractSafeSummary`。
3. 2026-03-27：已完成 `CliGovernanceRuntime` assembly check 的 second consumer cutover，并形成 `DA-249` 与目标集成回归。
