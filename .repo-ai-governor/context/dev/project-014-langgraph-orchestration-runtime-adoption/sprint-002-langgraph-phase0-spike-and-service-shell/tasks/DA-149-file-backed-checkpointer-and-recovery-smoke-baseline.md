# DA-149 file-backed checkpointer 与 recovery smoke 基线

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-149`
- Produced By: `TK-149`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 交付摘要

`packages/core-runtime-langgraph` 已补齐 file-backed checkpointer 的最小落地路径，当前交付两层能力：

1. `LangGraphFileCheckpointer`
2. `save -> read -> recover` recovery smoke baseline

本轮只实现 file-backed recovery 介质，不改 CLI 主链，也不把 checkpoint state 升格为 `current-context/tasks/review/artifacts/audit` 的 canonical source。

## 2. 实现结果

1. 新增 `LangGraphFileCheckpointer`
   - 以 `rootDirectory/langgraph-checkpoints/<executionId>/<executionSessionId>/checkpoint.json` 做 execution/session 命名空间隔离。
   - 提供 `save()`、`read()`、`recover()` 三个最小动作。
2. 固化 checkpoint payload
   - 保存字段只包含：
     - `processId`
     - `executionId`
     - `executionSessionId`
     - `activeNodeIds`
     - `visitedNodeIds`
     - `reducedState`
     - `pendingInterrupt`
     - `artifactReferenceIds`
     - `taskReferenceId`
   - 不写入 `current-context/tasks/review/artifacts/audit` 正文。
3. 增加 reduced-state fail-closed 校验
   - `reducedState` 的 top-level keys 必须属于 compiled graph plan 的 `reducedStateKeys`。
   - 出现越界 key 时直接抛出 `PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID`。
4. 增加 read/recovery 失败语义
   - 文件读写失败分别使用：
     - `PROCESS_RUNTIME_CHECKPOINT_READ_FAILED`
     - `PROCESS_RUNTIME_CHECKPOINT_WRITE_FAILED`
   - execution/session namespace 不匹配时直接 fail-closed。
5. 新增 recovery smoke 单测
   - 验证 checkpoint 持久化路径、execution/session namespace、pending interrupt 恢复和 disallowed reduced-state key 拦截。

## 3. 代码边界冻结

### 3.1 本轮已实现

1. `packages/core-runtime-langgraph/src/file-backed-checkpointer.ts`
2. `packages/core-runtime-langgraph/src/types/interfaces/langgraph-checkpointer.interface.ts`
3. `packages/core-runtime-langgraph/src/constants/langgraph-runtime.constant.ts`
4. `packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts`
5. `packages/shared/src/errors/error-code.constant.ts`

### 3.2 本轮刻意不做

1. 不接 `sqlite-fs` provider
2. 不接 `shared local orchestration service`
3. 不把 checkpoint 与 CLI run/review/HITL 主链联通
4. 不把 checkpoint payload 纳入 parity compare 正式比较面

这些工作保留给 `TK-150` 和 `TK-151`。

## 4. recovery contract

### 4.1 checkpoint path

1. `rootDirectory/langgraph-checkpoints/<executionId>/<executionSessionId>/checkpoint.json`

### 4.2 recovery output

1. `recovered`
2. `checkpointSource`
3. `checkpointId`
4. `checkpointPath`
5. `processId`
6. `executionId`
7. `executionSessionId`
8. `nextNodeIds`
9. `visitedNodeIds`
10. `pendingInterrupt`
11. `recoveredAt`

### 4.3 fail-closed 规则

1. reduced-state key 超出 `plan.reducedStateKeys` 时阻断保存
2. execution/session namespace 与已保存 checkpoint 不匹配时阻断读取
3. 文件写入失败或读取失败时返回明确 runtime checkpoint error code

## 5. 与 sprint-002 后续任务的关系

1. `TK-150` 直接消费本产物，把 `run/review/HITL` 最小主链接到 file-backed recovery 基线之上。
2. `TK-151` 直接消费本产物，将 file-backed 路径升级到 `sqlite-fs` 和 service shell。
3. `TK-152` 需要把本产物作为 sprint-002 出口验收的正式证据之一。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts packages/core-runtime-langgraph/test/compiled-ir-graph-adapter.unit.test.ts packages/core-runtime-langgraph/test/langgraph-runtime-backend.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
6. `pnpm run check`

## 7. 证据路径

1. `packages/core-runtime-langgraph/src/file-backed-checkpointer.ts`
2. `packages/core-runtime-langgraph/src/types/interfaces/langgraph-checkpointer.interface.ts`
3. `packages/core-runtime-langgraph/src/constants/langgraph-runtime.constant.ts`
4. `packages/core-runtime-langgraph/src/index.ts`
5. `packages/core-runtime-langgraph/test/file-backed-checkpointer.unit.test.ts`
6. `packages/shared/src/errors/error-code.constant.ts`
