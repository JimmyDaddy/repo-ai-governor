# TK-154 orchestration-service-client transport-neutral streaming 与 desktop-ready DTO hardening

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-003-service-backed-execution-and-desktop-transport`

## 1. 任务目标

固化 `orchestration-service-client` 的 transport-neutral request/response/event DTO 与 streaming contract，使 CLI 与未来 desktop client 可以通过同一套消费面接入 service owner。

## 2. Depends On

1. `TK-153`
2. `DA-144`
3. `DA-151`
4. `DA-152`

## 3. 预期产物

1. `DA-154` orchestration-service-client transport-neutral streaming 与 desktop-ready DTO hardening。

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-151-sqlite-fs-checkpointer-and-shared-local-orchestration-service-shell-convergence.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-152-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 6. 实施计划

1. 收敛 request/response DTO，避免 CLI 内部对象直接透传到 service contract。
2. 固定 transport-neutral streaming event schema、subscription token 与 desktop-ready payload 字段。
3. 为后续 IPC/daemon/desktop transport 预留 host/transport seam，但不在本任务中绑定单一 transport 实现。
4. 产出 `DA-154`，记录 DTO/event contract 与未来 client 使用约束。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-03-25：任务创建，状态初始化为 `planned`。
2. 2026-03-25：状态切换为 `in_progress`，开始收敛 transport-neutral `subscribeExecution` request、desktop-ready host/transport seam 与 stream cursor/event sequence contract。
3. 2026-03-25：已完成 `orchestration-service-client` DTO/event contract、`LocalOrchestrationServiceShell` 的 cursor/sequence owner 语义、增量订阅回归与 `DA-154`；review 直接收口为 resolved。

## 10. 产出

1. `DA-154` `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/DA-154-orchestration-service-client-transport-neutral-streaming-and-desktop-ready-dto-hardening.md`
