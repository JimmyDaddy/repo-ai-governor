# Agent Projection Contract

- Status: active
- Date: 2026-03-28
- Contract ID: `contract.runtime.agent-projection.v1`
- Producer Module: `runtime.agent-projection`

## 1. 目标

定义 role-agent projection 的最小 contract，使 `roleProfileId / routeKey / stageId / executionContext` 可以投影为可回放、可比较、可序列化的 `AgentDescriptor`。

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

## 5. Compatibility

1. `v1` 允许 `AgentDescriptor` 由 CLI、report 与 diagnostics 共用。
2. `v1` 允许在不引入 UI 事实源的前提下，为后续桌面端提供同一份投影数据。
