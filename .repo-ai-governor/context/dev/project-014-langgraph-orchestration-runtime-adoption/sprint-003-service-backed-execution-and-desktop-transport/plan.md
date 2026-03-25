# sprint-003-service-backed-execution-and-desktop-transport 计划

- Status: completed
- Date: 2026-03-25
- Project: `project-014-langgraph-orchestration-runtime-adoption`

## 1. Sprint Goal

将 `shared local orchestration service` 从 in-process shell 扩展为稳定的 service-backed execution 基线，收敛 transport-neutral / desktop-ready client contract，并完成 LangGraph cutover 的 service path 扩围验证。

## 2. Task Bundle

1. `TK-153` shared local orchestration service execution API 与 runtime owner 收敛
2. `TK-154` orchestration-service-client transport-neutral streaming 与 desktop-ready DTO hardening
3. `TK-155` service-backed HITL、recovery 与 execution list contract 收口
4. `TK-156` CLI `run/review/HITL/recovery` 到 orchestration-service-client 的 cutover
5. `TK-157` LangGraph service-backed parity 扩围与 daemon/desktop-ready transport spike
6. `TK-158` sprint-003 出口验收与 project-014 完成态判定

## 3. Entry Criteria

1. `DA-152` 已确认 sprint-002 `accept` 退出，并冻结 sprint-003 的 service-backed execution、desktop-ready contract 与 cutover 扩围输入约束。
2. `DA-144`、`DA-145`、`DA-151` 可检索，且 shared local orchestration service contract、rollout 边界与 current shell 基线已成立。
3. `LangGraph` 继续是唯一目标 backend；`legacy runtime` 仅可作为短生命周期 comparison baseline，不得恢复为长期并存模式。
4. `current-context` 已切换到 `project-014 / sprint-003`，不再继续在已完成的 sprint-002 上叠加实现工作。

## 4. Exit Criteria

1. service owner 已稳定持有 `start/get/list/stream/submitHitlDecision/recover` 级 execution API，且执行状态、checkpoint 与 event stream 不再散落在 CLI 内部。
2. `orchestration-service-client` 已形成 transport-neutral、desktop-ready 的 request/response/event DTO 基线，CLI 与未来 desktop 可复用同一 client contract。
3. CLI 的 `run/review/HITL/recovery` 已以 service client 为入口，LangGraph cutover parity 已扩围到 service-backed path。
4. sprint-003 已产出 `DA-153` ~ `DA-158`，并对 `project-014` 是否进入完成态给出正式判定。

## 5. Risks

1. 若 service-backed execution 直接暴露 runtime internals，而不是稳定 DTO/event contract，会重新破坏 client/service 分层。
2. 若 transport spike 先绑定具体 IPC/HTTP 实现，而没有先收敛 transport-neutral schema，后续 desktop 接入会反复改协议。
3. 若 CLI cutover 仍保留大量直接持有 runtime state 的旁路逻辑，service owner 的唯一事实边界会继续漂移。
4. 若 cutover parity 只比较 service 内部日志，而不比较 facade/service 对外产物，迁移验证会失真。
