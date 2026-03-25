# TK-147 core-runtime-langgraph backend skeleton 与 compiled IR graph adapter 基线

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-002-langgraph-phase0-spike-and-service-shell`

## 1. 任务目标

实现 `packages/core-runtime-langgraph` 的第一轮 backend skeleton，并完成 `compiled IR -> graph nodes/edges/state` 的正式适配基线。

## 2. Depends On

1. `TK-143`
2. `TK-145`
3. `TK-146`
4. `DA-143`
5. `DA-145`
6. `DA-146`

## 3. 预期产物

1. `DA-147` core-runtime-langgraph backend skeleton 与 compiled IR graph adapter 基线。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-145-langgraph-phase-0-spike-dual-runtime-parity-and-rollout-plan.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-146-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-142-langgraph-runtime-adoption-and-migration-baseline.md`

## 6. 实施计划

1. 新增 `core-runtime-langgraph` 的 package skeleton、入口导出与最小 runtime backend contract。
2. 将 `compiled IR` 映射为 graph nodes、edges、interrupt points 与 reduced state 结构。
3. 保持 backend 只处理 graph 执行语义，不把 policy/audit/ledger 搬入新包。
4. 产出 `DA-147`，固定 package 边界、IR 映射面与后续 task 的消费约束。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：sprint-002 启动，状态切换为 `in_progress`。
3. 2026-03-25：已完成 `packages/core-runtime-langgraph` 的 package skeleton、`CompiledIrGraphAdapter`、`LangGraphRuntimeBackend` 和单测，并产出 `DA-147`。

## 10. 产出

1. `DA-147` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-147-core-runtime-langgraph-backend-skeleton-and-compiled-ir-graph-adapter-baseline.md`
