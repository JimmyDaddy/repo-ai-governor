# DA-154 orchestration-service-client transport-neutral streaming 与 desktop-ready DTO hardening

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-154`
- Produced By: `TK-154`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 交付摘要

`TK-154` 将 `shared local orchestration service` 的 client contract 从“能开始消费”收敛到了“可以稳定扩展到 desktop/daemon transport”的阶段：`orchestration-service-client` 现在正式声明了 host/transport seam、stream cursor、event sequence 和 transport-neutral subscribe request；`LocalOrchestrationServiceShell` 也开始由 service 自身持有这些字段，而不是让 caller 自行拼装。

本轮核心收口了 3 件事：

1. `orchestration-service-client` 正式补齐 transport-neutral request/response/event DTO：`serviceHostKind`、`serviceTransportKind`、`latestEventSequence`、`nextCursor`、`OrchestrationSubscribeExecutionRequest`。
2. `LocalOrchestrationServiceShell` 开始稳定持有 stream cursor / event sequence / event id 生成权，`subscribeExecution` 支持 `executionId / eventStreamToken / cursor / afterSequence / limit`。
3. unit test 已覆盖 desktop-ready 的增量订阅路径，证明未来 desktop client 可以只依赖同一套 client contract 消费 service-backed stream。

## 2. 实现结果

### 2.1 client contract hardening

1. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
   - 新增 `OrchestrationServiceHostKind`：`embedded / sidecar / daemon`。
   - 新增 `OrchestrationServiceTransportKind`：`in_process / ipc / http`。
2. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
   - `OrchestrationStartExecutionResponse` 扩展：
     - `serviceHostKind`
     - `serviceTransportKind`
     - `latestEventSequence`
     - `nextCursor`
   - `OrchestrationServiceEvent` 扩展：
     - `eventId`
     - `sequence`
     - `streamCursor`
   - `OrchestrationExecutionSummary` 扩展：
     - `serviceHostKind`
     - `serviceTransportKind`
     - `latestEventSequence`
     - `nextCursor`
   - `OrchestrationSubscribeExecutionResponse` 扩展：
     - `serviceHostKind`
     - `serviceTransportKind`
     - `latestEventSequence`
     - `nextCursor`
   - 新增 `OrchestrationSubscribeExecutionRequest`：
     - `executionId?`
     - `eventStreamToken?`
     - `cursor?`
     - `afterSequence?`
     - `limit?`
3. `packages/orchestration-service-client/README.md`
   - 将 package 语义更新为 transport-neutral、desktop-ready 的 service client contract 基线。

### 2.2 service shell owner convergence

1. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
   - shell 现在正式持有：
     - `serviceHostKind`
     - `serviceTransportKind`
     - `eventIdProvider`
   - `startExecution()` 返回值与 summary 会同步暴露 host/transport seam、`latestEventSequence` 与 `nextCursor`。
   - `publishEvent()` 统一生成：
     - `eventId`
     - `sequence`
     - `streamCursor`
   - `subscribeExecution()` 改为消费 `OrchestrationSubscribeExecutionRequest`，支持 cursor-based 增量订阅。
   - stream cursor 采用 service-owned opaque payload，不将 caller 绑定到本地数据结构。
2. `packages/core-orchestration-service/README.md`
   - 补充 transport-neutral streaming cursor、event sequence 与 desktop-ready host/transport seam 的职责说明。

## 3. 契约结论

1. event stream 的主状态现在继续由 service owner 维护，CLI/未来 desktop 只消费稳定 DTO。
2. `cursor + latestEventSequence` 组合已经形成 transport-neutral 的最小 streaming contract，后续可继续落到 IPC/daemon/desktop client，而不需要重写业务语义。
3. 这轮仍然刻意不做：
   - 真正的 IPC / HTTP transport 实现
   - service-backed HITL / recovery / execution list 全量 UI surface
   - CLI 全量 cutover 到 service client

这些工作继续留给 `TK-155`、`TK-156`、`TK-157`。

## 4. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`

## 5. 证据路径

1. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
2. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
3. `packages/orchestration-service-client/README.md`
4. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
5. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-shell.interface.ts`
6. `packages/core-orchestration-service/README.md`
7. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
