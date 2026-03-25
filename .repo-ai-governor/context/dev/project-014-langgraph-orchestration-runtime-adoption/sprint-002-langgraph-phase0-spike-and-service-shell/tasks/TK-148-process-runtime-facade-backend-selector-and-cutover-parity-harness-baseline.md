# TK-148 Process Runtime facade backend selector 与 cutover parity harness 基线

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-002-langgraph-phase0-spike-and-service-shell`

## 1. 任务目标

在 `Process Runtime Facade` 中接入 backend selector 与短生命周期 cutover parity harness，并固定 facade 输出比较面与失败判定。

## 2. Depends On

1. `TK-147`
2. `DA-143`
3. `DA-145`
4. `DA-146`
5. `DA-147`

## 3. 预期产物

1. `DA-148` Process Runtime facade backend selector 与 cutover parity harness 基线。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-145-langgraph-phase-0-spike-dual-runtime-parity-and-rollout-plan.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-146-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-147-core-runtime-langgraph-backend-skeleton-and-compiled-ir-graph-adapter-baseline.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/plan.md`

## 6. 实施计划

1. 在 facade 中增加 backend selector，保证默认目标 backend 仍收敛到 `LangGraph`。
2. 建立短生命周期 parity harness，比对 facade 对外 contract、artifact/audit/review/HITL/recovery 终态。
3. 明确差异判定与 fail-closed 规则，不允许以 backend 内部日志替代正式产物比较。
4. 产出 `DA-148`，为后续 mainchain 接线与 recovery 实装提供正式 selector/parity 基线。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：开始执行，实现 `core-runtime` facade selector、LangGraph 默认 backend 路由与短生命周期 parity harness 公共契约。
3. 2026-03-25：已完成 `ProcessRuntimeFacade`、`ProcessRuntimeParityHarness`、workspace alias 补齐与单测，产出 `DA-148`。

## 10. 产出

1. `DA-148` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-148-process-runtime-facade-backend-selector-and-cutover-parity-harness-baseline.md`
