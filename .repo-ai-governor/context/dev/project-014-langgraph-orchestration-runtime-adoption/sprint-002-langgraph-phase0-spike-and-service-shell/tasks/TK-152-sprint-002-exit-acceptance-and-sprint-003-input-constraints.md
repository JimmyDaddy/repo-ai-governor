# TK-152 sprint-002 出口验收与 sprint-003 输入约束

- Status: planned
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-002-langgraph-phase0-spike-and-service-shell`

## 1. 任务目标

汇总 sprint-002 的实装结果、最小闭环证据与服务化边界，形成 `accept/block` 结论，并冻结 sprint-003 的输入约束。

## 2. Depends On

1. `TK-147`
2. `TK-148`
3. `TK-149`
4. `TK-150`
5. `TK-151`
6. `DA-147`
7. `DA-148`
8. `DA-149`
9. `DA-150`
10. `DA-151`

## 3. 预期产物

1. `DA-152` sprint-002 出口验收与 sprint-003 输入约束。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-147-core-runtime-langgraph-backend-skeleton-and-compiled-ir-graph-adapter-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-148-process-runtime-facade-backend-selector-and-cutover-parity-harness-baseline.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-149-file-backed-checkpointer-and-recovery-smoke-baseline.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-150-langgraph-run-review-hitl-minimal-mainchain-integration.md`
5. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-151-sqlite-fs-checkpointer-and-shared-local-orchestration-service-shell-convergence.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-146-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`

## 6. 实施计划

1. 汇总 `DA-147` ~ `DA-151` 的实装范围、风险收敛情况与未决项。
2. 给出 sprint-002 `accept/block` 结论，并判断是否具备继续扩大 service shell / desktop client / runtime cutover 的前提。
3. 冻结 sprint-003 的扩展输入约束与禁止回退边界。
4. 产出 `DA-152` 并同步 project-014 里程碑记录。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。

## 10. 产出

1. `DA-152` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-152-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`
