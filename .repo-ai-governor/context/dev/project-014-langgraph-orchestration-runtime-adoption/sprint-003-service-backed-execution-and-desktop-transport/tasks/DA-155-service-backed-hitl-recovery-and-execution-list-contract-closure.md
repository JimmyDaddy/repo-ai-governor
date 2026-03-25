# DA-155 service-backed HITL、recovery 与 execution list contract 收口

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-155`
- Produced By: `TK-155`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 交付摘要

`TK-155` 将 `LocalOrchestrationServiceShell` 从“已经具备最小 execution owner API”推进到了“关键服务响应不再依赖 caller 二次拼装”的阶段：execution list、HITL decision 和 recovery 现在都返回正式 request/response DTO，并把 artifact backlink、stream cursor 和 fail-closed 状态语义收敛到了 service contract。

本轮核心收口了 4 件事：

1. `orchestration-service-client` 正式补齐 `listExecutions` 的 request/response DTO，并把 `recoverExecution` 升级为 request object。
2. `submitHitlDecision` 和 `recoverExecution` 的响应现在直接返回 `executionSummary + latestEventSequence + nextCursor`，避免 CLI/未来 desktop client 继续拼装 service state。
3. `artifact.ready` 事件和 execution summary 现在都带 `artifactPath/latestArtifactPath`，形成正式 artifact backlink 字段。
4. shell 对无效 HITL 决策和终态 recovery 采用 fail-closed 语义，正式抛出 `MEMORY_SESSION_INVALID_STATUS`。

## 2. 实现结果

### 2.1 client contract closure

1. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
   - `OrchestrationServiceEvent` 新增 `artifactPath?`。
   - `OrchestrationExecutionSummary` 新增 `latestArtifactPath?`。
   - 新增 `OrchestrationListExecutionsRequest`：
     - `filter?`
     - `limit?`
   - 新增 `OrchestrationListExecutionsResponse`：
     - `executions`
     - `returnedCount`
     - `totalMatchedCount`
   - 新增 `OrchestrationRecoverExecutionRequest`。
   - `OrchestrationSubmitHitlDecisionResponse` 扩展：
     - `latestEventSequence`
     - `nextCursor`
     - `executionSummary`
   - `OrchestrationRecoverExecutionResponse` 扩展：
     - `recoveryCapable`
     - `latestEventSequence`
     - `nextCursor`
     - `executionSummary`
2. `packages/orchestration-service-client/README.md`
   - 同步固定 execution list、HITL response 和 recovery response 的 service-owned 语义。

### 2.2 service owner convergence

1. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
   - `listExecutions()` 改为返回正式 response DTO，并支持 `limit`。
   - `submitHitlDecision()` 在 execution 不处于 `pendingHitl=true` 时 fail-closed。
   - `recoverExecution()` 在 execution 已处于终态时 fail-closed；无 checkpoint 能力时返回 `recovered=false` 且保留当前 summary。
   - `artifact.ready` 事件与 summary 现在统一暴露：
     - `artifactPath`
     - `latestArtifactPath`
   - checkpoint 与 HITL receipt 的 artifact backlink 都已纳入正式响应链。
2. `packages/core-orchestration-service/README.md`
   - 将 `submitHitlDecision/recover` 的 service-owned response 和 backlink ownership 写入包级职责。

## 3. 契约结论

1. `listExecutions` 不再只是临时数组查询，而是正式的 service list contract，可以直接被未来 desktop execution list 消费。
2. `submitHitlDecision` 与 `recoverExecution` 的返回值现在足够让 caller 更新展示态，而不需要再从 CLI 内部状态推导最新 cursor、artifact backlink 或 execution summary。
3. 无效状态下的 HITL / recovery 请求已经明确 fail-closed，避免 client 误以为 service 接受了不合法状态迁移。
4. 这轮仍然刻意不做：
   - 独立 daemon / IPC transport
   - service-owned audit recorder
   - CLI 全量 cutover 到 orchestration-service-client

这些工作继续留给 `TK-156`、`TK-157`。

## 4. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`

## 5. 证据路径

1. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
2. `packages/orchestration-service-client/src/types/interfaces/index.ts`
3. `packages/orchestration-service-client/src/types/index.ts`
4. `packages/orchestration-service-client/src/index.ts`
5. `packages/orchestration-service-client/README.md`
6. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
7. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-shell.interface.ts`
8. `packages/core-orchestration-service/README.md`
9. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
