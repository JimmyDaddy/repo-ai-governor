# DA-148 Process Runtime facade backend selector 与 cutover parity harness 基线

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-148`
- Produced By: `TK-148`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 交付摘要

`packages/core-runtime` 已补齐 `Process Runtime Facade` 的 backend selector 与短生命周期 cutover parity harness 公共契约。当前交付固定了三件事：

1. facade 默认目标 backend 为 `LangGraph`
2. `legacy runtime` 只作为短期 comparison baseline 存在
3. parity harness 只比较 facade 正式输出面，不比较 backend 内部日志

本轮仍不接 CLI 主链，也不把 artifact/audit/review/HITL/recovery 的 canonical source 写入责任下沉到 `core-runtime`。

## 2. 实现结果

1. 新增 `ProcessRuntimeFacade`
   - 提供 `selectBackend()`，默认选中 `langgraph`，并在开启 parity 时自动挂载 `legacy` comparison backend。
   - 提供 `prepare(compiledIr, options)`，对外返回统一的 prepared execution profile。
   - 当目标 backend 不可用时，以 `PROCESS_RUNTIME_BACKEND_UNAVAILABLE` fail-closed。
2. 新增 prepared execution 统一契约
   - 对 `legacy` 与 `langgraph` 两类 backend 统一暴露：
     - `backend`
     - `entryNodeId`
     - `currentStatus`
     - `initialNodeIds`
     - `supportedInterruptKinds`
     - `supportedTerminalStatuses`
     - `lifecycleEvents`
     - `nodeCount / edgeCount`
3. 新增 `ProcessRuntimeParityHarness`
   - 只比较 facade 对外正式输出面：
     - `pretty/plain/json`
     - `artifactPaths`
     - `auditRecordIds`
     - `reviewState`
     - `hitlState`
     - `recoveryState`
     - `execution` 摘要
   - 不把 lifecycle event fan-out、backend 内部日志或 checkpoint payload 结构纳入 parity 判定。
4. 补齐测试与测试解析链
   - 新增 `process-runtime-facade.unit.test.ts`
   - 为 Vitest alias 增补 `@repo-ai-governor/core-runtime-langgraph`

## 3. 代码边界冻结

### 3.1 本轮已实现

1. `packages/core-runtime/src/process-runtime-facade.ts`
2. `packages/core-runtime/src/process-runtime-parity-harness.ts`
3. `packages/core-runtime/src/types/interfaces/runtime-facade.interface.ts`
4. `packages/core-runtime/test/process-runtime-facade.unit.test.ts`
5. `packages/shared/src/errors/error-code.constant.ts`
6. `vitest.internal-alias.ts`

### 3.2 本轮刻意不做

1. 不修改 `apps/cli` 的 `executeRunCommand()` 主链接线
2. 不在 `core-runtime` 内直接收集 artifact/audit/review/HITL/recovery 正文
3. 不把 `legacy runtime` 变成长期 product mode
4. 不实现 file-backed / `sqlite-fs` recovery

这些工作保留给 `TK-149` ~ `TK-151`。

## 4. selector 与 parity contract

### 4.1 backend selector

1. 默认 backend：`langgraph`
2. comparison backend：仅在 `enableParityHarness=true` 时启用
3. 默认 comparison 路由：
   - 主 backend 为 `langgraph` 时，comparison 为 `legacy`
   - 主 backend 为 `legacy` 时，comparison 为 `langgraph`
4. 任何被选中的 backend 若不可用，必须直接 fail-closed

### 4.2 parity harness

1. blocking diff 范围：
   - facade 输出 contract 漂移
   - artifact/audit/review/HITL/recovery 正式状态漂移
   - execution status/interruption/stage summary 漂移
2. 不进入 parity 的范围：
   - backend 内部日志顺序
   - lifecycle event fan-out 细节
   - graph/checkpointer 内部 payload 结构

## 5. 与 sprint-002 后续任务的关系

1. `TK-149` 可继续保持 recovery 聚焦，不需要再定义 selector/parity 公共契约。
2. `TK-150` 必须正式消费本产物，把 `task-driven run` 主链接到 facade，而不是直接耦合某个 backend 实现。
3. `TK-152` 需要将本产物作为 sprint-002 出口验收的正式证据之一。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-runtime/test/process-runtime-facade.unit.test.ts packages/core-runtime/test/process-runtime-engine.unit.test.ts packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
6. `pnpm run check`

## 7. 证据路径

1. `packages/core-runtime/src/process-runtime-facade.ts`
2. `packages/core-runtime/src/process-runtime-parity-harness.ts`
3. `packages/core-runtime/src/types/interfaces/runtime-facade.interface.ts`
4. `packages/core-runtime/src/index.ts`
5. `packages/core-runtime/test/process-runtime-facade.unit.test.ts`
6. `packages/shared/src/errors/error-code.constant.ts`
7. `vitest.internal-alias.ts`
