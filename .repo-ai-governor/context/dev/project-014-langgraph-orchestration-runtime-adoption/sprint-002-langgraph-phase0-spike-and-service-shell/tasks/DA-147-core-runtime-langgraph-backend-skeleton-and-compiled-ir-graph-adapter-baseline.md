# DA-147 core-runtime-langgraph backend skeleton 与 compiled IR graph adapter 基线

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-147`
- Produced By: `TK-147`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 交付摘要

`packages/core-runtime-langgraph` 已正式落地为独立 workspace package，当前交付两层能力：

1. `compiled IR -> graph plan` 适配器 `CompiledIrGraphAdapter`
2. 可实例化的 runtime backend skeleton `LangGraphRuntimeBackend`

本轮不直接改写 CLI 主链，也不把 policy/audit/ledger 搬进新包；包职责保持在 `DA-143` 固定的 backend/adapter 边界内。

## 2. 实现结果

1. 新增 workspace package `@repo-ai-governor/core-runtime-langgraph`
   - 已补齐 `package.json`、`README.md`、`src/index.ts` 与类型导出入口。
2. 新增 `CompiledIrGraphAdapter`
   - 对 `ProcessCompiledIr` 执行 IR 版本检查与 compile-error fail-closed。
   - 将 `ProcessNodeType` 映射为 graph node behavior：`invoke_stage / branch / fan_out / loop`。
   - 将 edge 映射为 graph edge behavior：`direct / conditional / parallel / loop_continue / loop_exit`。
   - 固定 `terminalNodeIds`、`reducedStateKeys` 与 `checkpointerStateKeys`。
3. 新增 `LangGraphRuntimeBackend`
   - 提供 `prepare(compiledIr)`，输出初始 execution envelope。
   - 返回 `plan`、`initialNodeIds`、`supportedInterruptKinds`、`supportedTerminalStatuses` 与 skeleton lifecycle events。
4. 新增单测
   - 覆盖复杂 node/edge 行为映射。
   - 覆盖 compile-error fail-closed。
   - 覆盖 backend skeleton 的 `prepare()` 结果。

## 3. 代码边界冻结

### 3.1 本轮已实现

1. `packages/core-runtime-langgraph/src/compiled-ir-graph-adapter.ts`
2. `packages/core-runtime-langgraph/src/langgraph-runtime-backend.ts`
3. `packages/core-runtime-langgraph/src/constants/*`
4. `packages/core-runtime-langgraph/src/types/*`
5. `packages/core-runtime-langgraph/test/*`

### 3.2 本轮刻意不做

1. 不接 `apps/cli` facade selector
2. 不接 `run/review/HITL` 主链
3. 不引入 file-backed / `sqlite-fs` checkpointer 实装
4. 不让新包直接写入 audit、artifact registry、review 或 task ledger

这些工作保留给 `TK-148` ~ `TK-151`。

## 4. graph plan 契约

1. node 级别输出：
   - `nodeId`
   - `stageId`
   - `nodeType`
   - `behavior`
   - `incomingEdgeIds / outgoingEdgeIds`
   - `routeKey / roleProfileId / schema/policy refs`
2. edge 级别输出：
   - `edgeId`
   - `fromNodeId / toNodeId`
   - `behavior`
   - `conditionKey?`
3. execution skeleton 输出：
   - `initialNodeIds`
   - `currentStatus`
   - `supportedInterruptKinds`
   - `supportedTerminalStatuses`
   - `lifecycleEvents`

## 5. 与 sprint-002 后续任务的关系

1. `TK-148` 直接消费本产物，把 facade backend selector 和 parity harness 接到新 backend skeleton 上。
2. `TK-149` 直接消费本产物，为 file-backed recovery 增加 checkpoint 载体和恢复语义。
3. `TK-150` 直接消费本产物，将 `run/review/HITL` 最小主链接到新的 backend。
4. `TK-152` 需要把本产物作为 sprint-002 出口验收的正式证据之一。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/compiled-ir-graph-adapter.unit.test.ts packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
6. `pnpm run check`

## 7. 证据路径

1. `packages/core-runtime-langgraph/package.json`
2. `packages/core-runtime-langgraph/src/compiled-ir-graph-adapter.ts`
3. `packages/core-runtime-langgraph/src/langgraph-runtime-backend.ts`
4. `packages/core-runtime-langgraph/src/constants/langgraph-runtime.constant.ts`
5. `packages/core-runtime-langgraph/src/types/interfaces/langgraph-compiled-graph-plan.interface.ts`
6. `packages/core-runtime-langgraph/src/types/interfaces/langgraph-runtime-backend.interface.ts`
7. `packages/core-runtime-langgraph/test/compiled-ir-graph-adapter.unit.test.ts`
8. `packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts`
