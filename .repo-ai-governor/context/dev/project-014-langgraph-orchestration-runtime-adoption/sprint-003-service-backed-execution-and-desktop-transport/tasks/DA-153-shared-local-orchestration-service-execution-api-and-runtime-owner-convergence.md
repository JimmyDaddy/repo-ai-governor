# DA-153 shared local orchestration service execution API 与 runtime owner 收敛

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-153`
- Produced By: `TK-153`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 交付摘要

`TK-153` 将 sprint-002 的 in-process service shell 进一步收敛成了更像正式 execution owner 的基线：`orchestration-service-client` 现在不只定义 `start/get/stream/recover`，还正式补齐了 `listExecutions`、execution summary owner 字段与 filter contract；`LocalOrchestrationServiceShell` 也不再把内部 summary 对象直接暴露给 caller。

本轮核心收口了 3 件事：

1. `orchestration-service-client` 正式补齐 `listExecutions(filter?)` 与 execution list filter DTO。
2. `LocalOrchestrationServiceShell` 开始稳定持有 execution owner 级 summary 字段：`recoveryCapable`、`pendingHitl`、`lastEventAt`、`latestEventType`、`currentStageId`、`latestArtifactId`。
3. `getExecution/listExecutions` 改为返回 clone，而不是直接暴露 service 内部可变 summary 引用。

## 2. 实现结果

### 2.1 client contract 扩展

1. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
   - 新增 `OrchestrationListExecutionsFilter`。
   - `OrchestrationServiceClient` 新增 `listExecutions(filter?)`。
   - `OrchestrationExecutionSummary` 扩展为 execution owner 语义更完整的 summary：
     - `recoveryCapable`
     - `pendingHitl`
     - `lastEventAt`
     - `latestEventType`
     - `currentStageId`
     - `latestArtifactId`
2. `packages/orchestration-service-client/src/index.ts`
   - 对外导出新的 filter 与 summary contract。
3. `packages/orchestration-service-client/README.md`
   - 将 package 语义更新为 `start/get/list/subscribe/recover` 级 execution owner contract 基线。

### 2.2 local service owner 收敛

1. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
   - 新增 `listExecutions(filter?)`，支持 `workspaceId/status/taskId/projectId/sprintId` 过滤。
   - `publishEvent()` 会同步更新：
     - `lastEventAt`
     - `latestEventType`
     - `currentStageId`
     - `latestArtifactId`
   - `saveCheckpoint()` 与 recovery 路径现在显式维护 `recoveryCapable`。
   - `getExecution()` / `listExecutions()` 不再把内部 summary 引用暴露给 caller，改为返回 clone。
2. `packages/core-orchestration-service/README.md`
   - 同步更新为 `execution summary + execution list + buffered event stream` 的 owner 基线。

## 3. 契约结论

1. execution summary 的主状态现在继续由 service owner 维护，CLI/未来 desktop 拿到的是稳定 DTO，而不是 service 内部引用。
2. `listExecutions` 已形成最小正式 API，可以作为后续 `execution list / recovery panel / desktop list view` 的公共基线。
3. 这轮仍然刻意不做：
   - 独立 transport / IPC / daemon host
   - CLI 全面 cutover 到 service client
   - service-backed HITL / recovery / execution list 的完整 UI surface

这些工作继续留给 `TK-154`、`TK-155`、`TK-156`。

## 4. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`

## 5. 证据路径

1. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
2. `packages/orchestration-service-client/src/index.ts`
3. `packages/orchestration-service-client/README.md`
4. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
5. `packages/core-orchestration-service/README.md`
6. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
