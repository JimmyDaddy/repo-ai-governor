# TK-150 LangGraph `run/review/HITL` 最小主链接线

- Status: planned
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-002-langgraph-phase0-spike-and-service-shell`

## 1. 任务目标

打通 `LangGraph` backend 下的 `run -> review -> review-verify -> HITL -> recovery` 最小主链，并保持 canonical source 回写不漂移。

## 2. Depends On

1. `TK-147`
2. `TK-148`
3. `TK-149`
4. `DA-144`
5. `DA-145`
6. `DA-146`
7. `DA-147`
8. `DA-149`

## 3. 预期产物

1. `DA-150` LangGraph `run/review/HITL` 最小主链接线。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-145-langgraph-phase-0-spike-dual-runtime-parity-and-rollout-plan.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-147-core-runtime-langgraph-backend-skeleton-and-compiled-ir-graph-adapter-baseline.md`
5. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-148-process-runtime-facade-backend-selector-and-cutover-parity-harness-baseline.md`
6. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-149-file-backed-checkpointer-and-recovery-smoke-baseline.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-146-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`

## 6. 实施计划

1. 将 `task-driven run` 主链接入 `LangGraph` backend，并保留 facade 对外 contract。
2. 接通 `review -> review-verify` 子链、HITL interrupt/resume 与 recovery，验证最小成功链和中断恢复链。
3. 确保 artifact/audit/review/ledger 的正式回写仍落到既有 canonical sources。
4. 产出 `DA-150`，固定最小主链实现边界与后续 service shell 消费约束。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。

## 10. 产出

1. `DA-150` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-150-langgraph-run-review-hitl-minimal-mainchain-integration.md`
