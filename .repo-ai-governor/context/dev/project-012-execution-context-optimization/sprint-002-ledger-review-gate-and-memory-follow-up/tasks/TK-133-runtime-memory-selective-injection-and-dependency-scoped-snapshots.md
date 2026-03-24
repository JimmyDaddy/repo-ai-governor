# TK-133 runtime memory 选择性注入与依赖定向快照

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P2
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-002-ledger-review-gate-and-memory-follow-up`

## 1. 任务目标

将 runtime memory/context 装配从全量 layered snapshot 收口为基于 `executionId`、`taskId`、`active stream` 与 `artifact dependency` 的定向查询与注入，避免 task-driven runtime 再次扩大默认上下文。

## 2. Depends On

1. `TK-129`
2. `TK-131`
3. `TK-132`

## 3. 预期产物

1. `DA-131` runtime memory 选择性注入与依赖定向快照产物文档。

## 4. Required Inputs

1. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md`
2. `packages/core-memory/src/memory-manager.ts`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-099-task-driven-dag-and-run-mainchain-assembly.md`
4. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/DA-127-sprint-001-exit-acceptance-and-rollout-input-constraints.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-015-memory-session-store-baseline.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/project-012-execution-context-optimization-completion-audit-summary.md`

## 6. 实施计划

1. 核对 `loadLayeredSnapshot()` 当前的全量快照行为与分析稿风险点。
2. 设计基于 execution/task/active-stream/dependency 的 selective query 与注入模型。
3. 对齐 task-driven runtime、artifact dependency resolver 与 memory manager 的边界。
4. 补齐 `DA-131`、验证与台账回写。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-memory/test/memory-manager.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，开始为 `MemoryManager.loadLayeredSnapshot()` 增加 execution/task/project/sprint/artifact 选择器，并将 task-driven runtime 改为注入 selective snapshot。
3. 2026-03-24：任务完成，memory manager 已支持 selective layered snapshot，task-driven run 会注入选择性 memory context 摘要，审计/会话记录也补齐了 task/execution/artifact 标签。

## 10. 产出

1. `DA-131` `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/DA-131-runtime-memory-selective-injection-and-dependency-scoped-snapshots.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/tasks.csv`
