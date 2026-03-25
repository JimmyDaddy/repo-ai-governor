# TK-153 shared local orchestration service execution API 与 runtime owner 收敛

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-003-service-backed-execution-and-desktop-transport`

## 1. 任务目标

将 `shared local orchestration service` 从 in-process shell 扩展为稳定的 execution owner，正式收敛 `startExecution/getExecution/listExecutions/subscribeExecution` 的 service API 与状态所有权。

## 2. Depends On

1. `TK-151`
2. `TK-152`
3. `DA-144`
4. `DA-151`
5. `DA-152`

## 3. 预期产物

1. `DA-153` shared local orchestration service execution API 与 runtime owner 收敛。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-151-sqlite-fs-checkpointer-and-shared-local-orchestration-service-shell-convergence.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-152-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 6. 实施计划

1. 收敛 service owner 侧的 execution state model、summary model 与 status transition。
2. 正式实现 `startExecution/getExecution/listExecutions/subscribeExecution` 的 service API，而不是继续仅依赖 shell 内部对象。
3. 固定 execution summary、event stream token、checkpoint capability 与 workspace identity 的 ownership 边界。
4. 产出 `DA-153`，记录 service API、状态所有权与后续 client/transport 消费约束。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：状态切换为 `in_progress`，开始收敛 `orchestration-service-client` 的 execution summary/filter DTO 与 `LocalOrchestrationServiceShell` 的 execution owner API。
3. 2026-03-25：已完成 `listExecutions()`、service-owned summary clone、recovery capability / latest event / current stage 字段收口，补齐 unit test 与 `DA-153`。

## 10. 产出

1. `DA-153` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/DA-153-shared-local-orchestration-service-execution-api-and-runtime-owner-convergence.md`
