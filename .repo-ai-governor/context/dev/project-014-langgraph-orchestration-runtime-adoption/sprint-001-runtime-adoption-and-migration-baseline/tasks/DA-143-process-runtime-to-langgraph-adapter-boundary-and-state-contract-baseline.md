# DA-143 Process Runtime -> LangGraph adapter 边界与 state contract 基线

- Status: active
- Date: 2026-03-25
- Source Task: `TK-143`
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-001-runtime-adoption-and-migration-baseline`

## 1. 交付摘要

`LangGraph` 已被收敛为 `Process Runtime` 的默认演进后端，但接入方式固定为 `Process Runtime (Facade) -> LangGraph Runtime Adapter`。`DSL -> IR -> policy -> audit -> ledger` 继续由本产品领域服务掌控，`LangGraph state/checkpointer` 只承担执行恢复与节点状态缓存，不升格为新的 canonical source。

## 2. 当前实现证据

1. `CliGovernanceRuntime.executeRunCommand()` 当前承担执行请求编排、risk/policy/HITL/audit/report 串联与 artifact 输出汇总。
2. `CliTaskDrivenRunRuntime.buildRunAssembly()` 负责将 `task card + active stream + dependency artifacts` 装配为 `processDefinition + stageInputs + memorySelection`。
3. `ProcessCompiler` 负责 `DSL -> compiled IR`，并将 IR 快照落盘到 workspace。
4. `ProcessRuntimeEngine.execute()` 当前只消费 `compiledIr + stageHandler + stageInputs`，返回标准化 stage results 与 interruption。
5. `MemoryManager.loadLayeredSnapshot()` 已支持按 `execution/task/project/sprint/artifact/session` 做 selective snapshot。
6. `SharedSessionManager` 与 `AuditRecorder` 已分别持有 `session` 与 `audit` 的持久化边界。

## 3. 责任边界冻结

### 3.1 Process Runtime (Facade)

1. 接收外部执行请求，并解析 `execution_id / execution_session_id / task / stream / artifact` 上下文。
2. 调用 `ProcessCompiler` 生成/校验 IR，并在迁移验证窗口内选择 `legacy runtime` 或 `LangGraph runtime` 后端；最终目标收敛为单一 `LangGraph runtime`。
3. 负责 risk/policy/HITL、audit、report、artifact registry、review chain、ledger backfill、delivery rehearsal 等领域服务编排。
4. 负责把 workspace canonical sources 读入为运行时输入，并在执行后将正式结果回写到 `current-context/tasks/review/artifacts/audit`。
5. 对外暴露稳定的 CLI/service 输出契约；不得把底层 graph state 直接暴露成产品对外 contract。

### 3.2 LangGraph Runtime Adapter

1. 负责把 `compiled IR` 映射为 graph nodes、edges、interrupt points 与 checkpointable state。
2. 只管理图执行语义：node scheduling、conditional routing、loop/parallel execution、interrupt/resume、per-node state。
3. 向 facade 返回标准化的 stage execution events、node outputs、interrupt payload 与 terminal status。
4. 不直接解析 task ledger、review lifecycle、artifact registry 或 `current-context`。
5. 不直接决定 policy outcome；policy 结果只能由 facade 注入为 conditional edge 输入或 interrupt decision。

### 3.3 外部领域服务节点

1. `review -> review-verify -> ledger backfill`
2. `notification dispatch / HITL receipt`
3. `artifact registration / report writing`
4. `delivery rehearsal`

这些 side effects 必须继续由 facade 或显式 service node 触发，并以幂等 key 控制重放；不得让 graph checkpoint 本身成为事实源。

## 4. 状态契约映射

| 产品主键/上下文 | Facade 语义 | LangGraph/Checkpointer 语义 | canonical source |
|---|---|---|---|
| `execution_id` | 一次执行的主键 | run metadata / checkpoint namespace selector | execution artifacts + audit |
| `execution_session_id` | 跨中断恢复的共享会话主键 | thread/checkpoint key | `MemoryScope.SESSION` |
| `process_id` | 当前 IR/flow 标识 | graph identity | compiled IR snapshot + session |
| `taskId` | task-driven 装配与 ledger/audit tagging | graph config input | task card + tasks.csv/checklist |
| `projectId` / `sprintId` | stream context 与 selective memory selector | graph config input | current-context + project/sprint docs |
| `artifactIds[]` | dependency injection selector | graph config input / state reference only | artifact registry |
| node cursor / retry count / pending interrupt | runtime recovery state | checkpoint payload | checkpointer only |
| stage output summary | runtime intermediate payload | checkpoint payload or event payload | promoted only after facade writes audit/artifacts |
| policy outcome / HITL decision | policy gate result | conditional edge input / interrupt resume payload | audit + HITL receipt artifact |

## 5. Checkpointer 准入/禁入规则

### 5.1 允许进入 checkpointer 的状态

1. 当前 node id、visited nodes、retry counters、loop state。
2. graph-local reduced state、pending interrupt payload、resume cursor。
3. `execution_id / execution_session_id / process_id / taskId` 等稳定主键引用。
4. memory selection 摘要、artifact id 引用、stage output 摘要。

### 5.2 禁止进入 checkpointer 的状态

1. `current-context.md` 的正文与 stream routing 决策。
2. `tasks/checklist.md`、`tasks/tasks.csv`、`TK-*` 的 canonical task state。
3. review lifecycle 文件正文与状态迁移。
4. artifact registry 行记录、audit 记录正文、execution report 正文。
5. 凭据、脱敏前原文、不可重放的外部副作用结果。

结论：checkpointer 是“可恢复执行态缓存”，不是“工作区治理事实源”。

## 6. Phase 0/1 实施约束

1. LangGraph adapter 必须复用现有 `ProcessCompiledIr`，不得再引入平行流程 DSL。
2. facade 必须保留 `pretty/plain/json` 外部输出契约；若存在迁移验证窗口，parity 比较只作为短生命周期 cutover harness，并以 facade 输出为比较面。
3. HITL `approve/reject/revise` 必须继续通过 receipt artifact + audit + session 回链，不得仅存在 graph memory。
4. review chain、ledger backfill、delivery rehearsal 必须走显式 service boundary，并带幂等 key。
5. failure/replay 语义以 `RuntimeExecutionResult + audit records + artifacts` 为验收准，不以底层 graph 内部日志为准。

## 7. 消费约束

1. `TK-144`、`TK-145` 必须把本产物视为 service shell 与 cutover parity harness 设计的正式 runtime 边界输入。
2. `TK-146` 必须用本产物判断 sprint-002 是否仍保持“runtime 可替换、canonical source 稳定”的前提。
3. 后续若要引入 `packages/core-runtime-langgraph`，包职责必须限制为 adapter/backend；不得把 policy/audit/ledger 搬进该包。

## 8. 证据路径

1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/runtime/task-driven-run-runtime.ts`
3. `packages/core-process/src/process-compiler.ts`
4. `packages/core-process/src/types/interfaces/process-ir.interface.ts`
5. `packages/core-runtime/src/process-runtime-engine.ts`
6. `packages/core-runtime/src/types/interfaces/runtime-execution.interface.ts`
7. `packages/core-memory/src/memory-manager.ts`
8. `packages/core-memory/src/types/interfaces/memory-manager.interface.ts`
9. `packages/core-session/src/shared-session-manager.ts`
10. `packages/core-session/src/audit-recorder.ts`
