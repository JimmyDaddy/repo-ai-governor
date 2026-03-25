# DA-151 `sqlite-fs` checkpointer 与 shared local orchestration service shell 收敛

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-151`
- Produced By: `TK-151`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 交付摘要

`TK-151` 将 LangGraph checkpoint 从 file-backed 路径收敛到 `sqlite-fs`，并把 execution/checkpoint/recovery 的最小 owner 收口进本地 shared orchestration service shell。

本轮正式落地 4 件事：

1. `core-runtime-langgraph` 新增 `LangGraphSqliteFsCheckpointer`，与 file-backed 共享同一套 fail-closed envelope 校验。
2. 新增 `orchestration-service-client`，固定 execution/HITL/recovery/event stream 的 transport-neutral DTO 与状态枚举。
3. 新增 `core-orchestration-service`，提供 in-process `LocalOrchestrationServiceShell`，持有 execution summary、buffered events 与 checkpoint/recovery 所有权。
4. `apps/cli` 的 `run` 主链不再直接实例化 checkpointer，而是通过 service shell 持有 `sqlite-fs` checkpoint/recovery，并向正式输出面暴露 `event_stream_token` 与 service status。

## 2. 实现结果

### 2.1 `sqlite-fs` checkpoint 介质

1. `packages/core-runtime-langgraph/src/sqlite-fs-checkpointer.ts`
   - 新增 `LangGraphSqliteFsCheckpointer`。
   - 默认落盘路径：`<workspace_root>/langgraph-checkpoints.sqlite`。
   - checkpoint locator 语义：`<db-file>#<executionId>/<executionSessionId>`。
2. `packages/core-runtime-langgraph/src/langgraph-checkpointer.abstract.ts`
   - 抽出 envelope 创建、reduced-state 校验、namespace/process id 校验与 pending interrupt fail-closed 校验。
   - file-backed 与 sqlite-fs 两种介质共享一套 payload contract。
3. `packages/core-runtime-langgraph/src/constants/langgraph-runtime.constant.ts`
   - `checkpoint source` 扩展为 `file-backed | sqlite-fs`。
   - 新增 sqlite-fs 默认 database/table 常量。

### 2.2 shared local orchestration service shell

1. `packages/orchestration-service-client`
   - 固定 `OrchestrationExecutionKind`、`OrchestrationClientSurface`、`OrchestrationExecutionStatus`、`OrchestrationServiceEventType`。
   - 固定 `start/get/subscribe/submitHitlDecision/recover` DTO 与 client contract。
2. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
   - 新增 `LocalOrchestrationServiceShell`。
   - 作为 in-process service shell 持有：
     - execution summary
     - event stream token
     - buffered execution events
     - sqlite-fs checkpoint/recovery state
   - 对外提供：
     - `startExecution()`
     - `getExecution()`
     - `subscribeExecution()`
     - `submitHitlDecision()`
     - `recoverExecution()`
   - 对 runtime owner 内部提供：
     - `publishEvent()`
     - `saveCheckpoint()`

### 2.3 CLI 接线收敛

1. `apps/cli/src/cli-governance-runtime.ts`
   - `run` 主链开始时创建 `LocalOrchestrationServiceShell` 并注册 execution。
   - stage、artifact、HITL、terminal 状态会同步写入 service event buffer。
   - `captureLangGraphCheckpointState()` 不再直接使用 `LangGraphFileCheckpointer`，改由 service shell 持有 `sqlite-fs` checkpoint/save/recover。
   - CLI 正式输出新增：
     - `orchestration_event_stream_token`
     - `orchestration_status`
   - `langgraph_checkpoint_source` 现固定为 `sqlite-fs`。

## 3. 代码边界冻结

### 3.1 本轮已实现

1. `packages/core-runtime-langgraph/src/langgraph-checkpointer.abstract.ts`
2. `packages/core-runtime-langgraph/src/sqlite-fs-checkpointer.ts`
3. `packages/orchestration-service-client/**`
4. `packages/core-orchestration-service/**`
5. `apps/cli/src/cli-governance-runtime.ts`
6. `apps/cli/test/cli-governance-runtime.integration.test.ts`

### 3.2 本轮刻意不做

1. 不把完整 `run/review/review-verify/HITL` 编排 owner 全量迁到 service shell。
2. 不引入独立 daemon / IPC / desktop host。
3. 不把 review queue、artifact registry、audit recorder 的 canonical source 写入责任迁入 service。
4. 不在本轮实现 `orchestration-service-client` 的独立 transport 或 desktop client。

这些工作留给 `TK-152` 之后的 sprint 继续收敛。

## 4. 契约结论

1. `CLI` 继续是 client/presenter，而不再直接持有 checkpoint/recovery owner。
2. `shared local orchestration service` 在 Phase 0 允许以内嵌 shell 形态与 CLI 同进程运行，但 contract 已经独立成包。
3. `LangGraph state/checkpointer` 仍只是恢复介质，不升格为 `current-context/tasks/review/artifacts/audit` 的 canonical source。
4. `sqlite-fs` 路线已成为当前默认 checkpoint 基线，file-backed 只保留为前序 smoke 基线与回溯证据。

## 5. 与后续任务的关系

1. `TK-152` 直接消费本产物，作为 sprint-002 出口验收中关于 `sqlite-fs + service shell` 的正式证据。
2. 后续 sprint 若继续推进 daemon / desktop client，只能基于 `orchestration-service-client` 扩展，不得让桌面端旁路调用 `core-runtime*`。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts packages/core-runtime-langgraph/test/sqlite-fs-checkpointer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
6. `pnpm run check`

## 7. 证据路径

1. `packages/core-runtime-langgraph/src/langgraph-checkpointer.abstract.ts`
2. `packages/core-runtime-langgraph/src/sqlite-fs-checkpointer.ts`
3. `packages/core-runtime-langgraph/test/sqlite-fs-checkpointer.unit.test.ts`
4. `packages/orchestration-service-client/src/index.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
6. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
7. `apps/cli/src/cli-governance-runtime.ts`
8. `apps/cli/test/cli-governance-runtime.integration.test.ts`
