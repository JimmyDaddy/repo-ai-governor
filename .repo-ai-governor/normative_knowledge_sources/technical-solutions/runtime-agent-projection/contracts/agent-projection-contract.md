# Agent Projection Contract

- Status: active
- Date: 2026-04-02
- Contract ID: `contract.runtime.agent-projection.v1`
- Producer Module: `runtime.agent-projection`

## 1. 目标

定义 role-agent projection 的最小 contract，使 `roleProfileId / routeKey / stageId / executionContext` 可以投影为可回放、可比较、可序列化的 `AgentDescriptor`，并在需要时稳定携带 `surface + transport + provider binding` 真值。

## 2. Minimum Fields

1. `agent_id`
2. `agent_role`
3. `role_profile_id`
4. `role_source`
5. `primary_surface`
6. `fallback_surfaces[]`
7. `capabilities[]`
8. `permission_level`
9. `input_schema_ref`
10. `output_schema_ref`
11. `error_contract_ref`
12. `max_execution_time_seconds`
13. `stage_timeout_seconds`
14. `token_budget`
15. `cost_budget`
16. `time_budget_seconds`
17. `retry_policy_ref`
18. `timeout_policy_ref`
19. `budget_policy_ref`
20. `workspace_id`
21. `workspace_mode`
22. `execution_id`
23. `session_id`
24. `selected_by`
25. `selected_surface`
26. `projection_status`
27. `failure_reasons[]`
28. `selected_transport`
29. `selected_provider_kind`
30. `selected_vendor_binding_kind`
31. `selected_model`
32. `capability_snapshot_source`

## 3. Allowed Values

1. `role_source`
   - `default`
   - `custom`
2. `permission_level`
   - `read`
   - `edit`
   - `test`
   - `commit`
   - `pr`
3. `workspace_mode`
   - `tool_managed`
   - `repo_local`

## 4. Required Constraints

1. Projection 只负责把现有 role / surface / session / capability 组合成 agent 视图，不得成为新的 canonical source。
2. `AgentSessionRegistry` 只允许做 session 投影，不得创建与 `Shared Session Manager` 平行的事实源。
3. 同一组输入必须幂等地产生同一 `AgentDescriptor`。
4. `execution_id` 与 `session_id` 仅作为投影回链，不得反向污染运行时语义。
5. LangGraph supervisor 只能消费 descriptor，不得把 descriptor 再次改写为新的流程定义。
6. `selected_surface` 继续保留为用户语义主键，但当 runtime 已解析到 transport / provider binding 时，replay truth 不得只剩 surface 名称。
7. capability snapshot 必须按 transport 计算，不允许把同一 surface 的 `cli_exec` 能力偷渡给 `remote_api` 路径。
8. fallback 决策必须能区分“surface 不可用”和“同 surface 的 remote_api binding 不可用”。

## 5. Compatibility

1. `v1` 允许 `AgentDescriptor` 由 CLI、report 与 diagnostics 共用。
2. `v1` 允许在不引入 UI 事实源的前提下，为后续桌面端提供同一份投影数据。
3. `v1` 允许 shared presenter/view-model 对 `selected_by`、`selected_surface`、`projection_status` 与 `failure_reasons` 做派生渲染，但不得把 presenter 结果反向写回 runtime truth。
4. `v1` 允许以 additive fields 扩展 `selected_transport`、`selected_provider_kind`、`selected_vendor_binding_kind`、`selected_model` 与 `capability_snapshot_source`，使旧 consumer 仍可只读取 `selected_surface`。
