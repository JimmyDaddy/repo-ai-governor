# TK-156 CLI `run/review/HITL/recovery` 到 orchestration-service-client 的 cutover

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-003-service-backed-execution-and-desktop-transport`

## 1. 任务目标

将 CLI 的 `run/review/HITL/recovery` 主链正式切到 `orchestration-service-client`，减少对 runtime/service internals 的直接依赖，让 CLI 回归 client/presenter 角色。

## 2. Depends On

1. `TK-153`
2. `TK-154`
3. `TK-155`
4. `DA-150`
5. `DA-151`
6. `DA-152`

## 3. 预期产物

1. `DA-156` CLI `run/review/HITL/recovery` 到 orchestration-service-client 的 cutover。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-150-langgraph-run-review-hitl-minimal-mainchain-integration.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-151-sqlite-fs-checkpointer-and-shared-local-orchestration-service-shell-convergence.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-152-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/TK-153-shared-local-orchestration-service-execution-api-and-runtime-owner-convergence.md`
5. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/TK-154-orchestration-service-client-transport-neutral-streaming-and-desktop-ready-dto-hardening.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 6. 实施计划

1. 让 CLI 通过 service client 发起 execution、订阅 event stream、提交 HITL 决策与恢复请求。
2. 清理 CLI 仍直接依赖 runtime/service 内部对象的旁路路径，保持 presenter 角色纯化。
3. 保证 `pretty/plain/json` 输出仍兼容既有 contract，不因 client cutover 漂移。
4. 产出 `DA-156`，记录 cutover 范围、保留的 compatibility seam 与后续 desktop client 复用方式。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：状态切换为 `in_progress`，开始将 CLI 的 `run/review/review-verify` 收敛到 package-local orchestration service runtime，并清理对 `LocalOrchestrationServiceShell` 的直接依赖。
3. 2026-03-25：已完成 `review/review-verify` 的 service-backed execution 接线、`run` 的 HITL/recovery client cutover、review/HITL orchestration details 输出，以及相关 integration/unit 回归；产出 `DA-156` 并将 review 直接收口为 resolved。

## 10. 产出

1. `DA-156` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/DA-156-cli-run-review-hitl-recovery-to-orchestration-service-client-cutover.md`
