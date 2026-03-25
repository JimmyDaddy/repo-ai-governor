# sprint-002-langgraph-phase0-spike-and-service-shell 计划

- Status: active
- Date: 2026-03-25
- Project: `project-014-langgraph-orchestration-runtime-adoption`

## 1. Sprint Goal

落地 `LangGraph` Phase 0 最小闭环，实现 graph backend、短期 parity harness、checkpoint/recovery 与 shared local orchestration service shell 的第一轮正式接线。

## 2. Task Bundle

1. `TK-147` core-runtime-langgraph backend skeleton 与 compiled IR graph adapter 基线
2. `TK-148` Process Runtime facade backend selector 与 cutover parity harness 基线
3. `TK-149` file-backed checkpointer 与 recovery smoke 基线
4. `TK-150` LangGraph `run/review/HITL` 最小主链接线
5. `TK-151` `sqlite-fs` checkpointer 与 shared local orchestration service shell 收敛
6. `TK-152` sprint-002 出口验收与 sprint-003 输入约束

## 3. Entry Criteria

1. `DA-146` 已确认 sprint-001 `accept` 退出，并冻结 sprint-002 的 backend、service shell、checkpoint/recovery 与 parity 输入约束。
2. `DA-143`、`DA-144`、`DA-145` 可检索，且 runtime boundary、service contract、Phase 0/1 rollout 路径已形成正式 baseline。
3. `project-011` 与 `project-012` 的 CLI bounded-context、task-ledger、review-chain 与 selective memory 治理基线仍保持有效。
4. 当前工作树与 `current-context` 已切换到 `project-014 / sprint-002`，不再继续在已完成的 sprint-001 上叠加实现工作。

## 4. Exit Criteria

1. `core-runtime-langgraph` backend skeleton 已能消费 `compiled IR` 并输出标准化 execution events、interrupt 和 terminal status。
2. facade backend selector、短生命周期 parity harness 与 file-backed recovery smoke 已形成正式 baseline。
3. `run -> review -> review-verify -> HITL -> recovery` 的 LangGraph 最小主链已完成第一轮正式接线，并保持 canonical source 回写不漂移。
4. `sqlite-fs` checkpointer 与 `shared local orchestration service` shell 已形成可继续扩展的正式 baseline，并沉淀 `DA-147` ~ `DA-152`。

## 5. Risks

1. 若在 `core-runtime-langgraph` 中直接承载 policy/audit/ledger 语义，会破坏 `DA-143` 固定的 facade/backend 边界。
2. 若 parity harness 只依赖 backend 内部日志，而不是 facade 对外产物，会让 cutover 验证失去意义。
3. 若 checkpoint 混入不可重放 side effects，recovery smoke 可能通过一次但无法形成稳定恢复语义。
4. 若 service shell 先扩成大全命令面，而不是先收敛 `run/review/HITL/recovery` 主链，会稀释本 sprint 的实现重心。
