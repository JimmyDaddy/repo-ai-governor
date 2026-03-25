# TK-155 service-backed HITL、recovery 与 execution list contract 收口

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-003-service-backed-execution-and-desktop-transport`

## 1. 任务目标

将 `submitHitlDecision`、`listExecutions`、`recoverExecution` 等关键路径正式收敛到 service owner contract，使 HITL 回执、恢复执行与 execution list 不再依赖 CLI 内部状态拼装。

## 2. Depends On

1. `TK-153`
2. `TK-154`
3. `DA-144`
4. `DA-151`
5. `DA-152`

## 3. 预期产物

1. `DA-155` service-backed HITL、recovery 与 execution list contract 收口。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-150-langgraph-run-review-hitl-minimal-mainchain-integration.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-151-sqlite-fs-checkpointer-and-shared-local-orchestration-service-shell-convergence.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-152-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 6. 实施计划

1. 将 service owner 对 HITL pending state、decision receipt、recovery cursor 与 execution list 的 ownership 明确收口。
2. 固定 `submitHitlDecision/listExecutions/recoverExecution` 的 request/response 结构与 error semantics。
3. 确保 checkpoint locator、event stream token、execution summary 与 audit/artifact 回链字段兼容 sprint-002 既有输出。
4. 产出 `DA-155`，记录 service-backed HITL/recovery/execution list 的正式 contract。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：状态切换为 `in_progress`，开始收敛 `listExecutions`、`submitHitlDecision`、`recoverExecution` 的正式 request/response 与 fail-closed 语义。
3. 2026-03-25：已完成 execution list response、HITL/recovery service-owned DTO、artifact backlink 字段与 fail-closed 回归，产出 `DA-155`；review 直接收口为 resolved。

## 10. 产出

1. `DA-155` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/DA-155-service-backed-hitl-recovery-and-execution-list-contract-closure.md`
