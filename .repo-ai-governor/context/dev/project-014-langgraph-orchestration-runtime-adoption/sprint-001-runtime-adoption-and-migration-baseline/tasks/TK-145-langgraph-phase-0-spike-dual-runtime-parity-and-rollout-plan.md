# TK-145 LangGraph Phase 0 spike、cutover parity 验证与 rollout 迁移计划

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-001-runtime-adoption-and-migration-baseline`

## 1. 任务目标

定义 `LangGraph` Phase 0 spike、短生命周期 cutover parity 验证 harness、checkpointer 路径与 rollout 迁移计划的正式验收矩阵。

## 2. Depends On

1. `TK-143`
2. `TK-144`
3. `DA-143`
4. `DA-144`

## 3. 预期产物

1. `DA-145` LangGraph spike、cutover parity 验证与 rollout 迁移计划。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-141-sprint-001-exit-acceptance-and-rollout-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/tasks/DA-132-sprint-002-exit-acceptance-and-project-012-reclosure.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
5. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-142-langgraph-runtime-adoption-and-migration-baseline.md`
6. `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md`

## 6. 实施计划

1. 明确 Phase 0 spike 的最小闭环：`run -> review -> review-verify` + 1 条 HITL interrupt/resume。
2. 冻结短生命周期 cutover parity harness 的比较维度：输出契约、artifact/audit/ledger 一致性、failure semantics、replay/recovery 语义。
3. 确定 checkpointer 路径与 rollout 顺序：file-backed -> sqlite-fs -> shared local orchestration service，并明确 `legacy runtime` 只作为迁移验证基线，不作为长期并存 backend。
4. 产出 `DA-145` 并给 sprint-002 implementation 拆解提供输入。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：完成 `DA-145`，已冻结 Phase 0 最小闭环、短生命周期 cutover parity harness、checkpointer 路径与 sprint-002 rollout 顺序。

## 10. 产出

1. `DA-145` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-145-langgraph-phase-0-spike-dual-runtime-parity-and-rollout-plan.md`
