# Agent Projection Contract

- Status: active
- Date: 2026-04-11
- Contract ID: `contract.runtime.agent-projection.v1`
- Producer Module: `runtime.agent-projection`

## 1. 目标

定义 role-agent projection 与 adapter-facing continuation seam 的最小 contract，使 `roleProfileId / routeKey / stageId / executionContext` 可以投影为可回放、可比较、可序列化的 `AgentDescriptor`，并在需要时稳定携带 `surface + transport + provider binding` 真值以及 provider-native conversation continuation 的兼容性边界。

## 2. AgentDescriptor Minimum Fields

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

## 3. AgentDescriptor Allowed Values

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

## 4. AgentDescriptor Required Constraints

1. Projection 只负责把现有 role / surface / session / capability 组合成 agent 视图，不得成为新的 canonical source。
2. `AgentSessionRegistry` 只允许做 session 投影，不得创建与 `Shared Session Manager` 平行的事实源。
3. 同一组输入必须幂等地产生同一 `AgentDescriptor`。
4. `execution_id` 与 `session_id` 仅作为投影回链，不得反向污染运行时语义。
5. LangGraph supervisor 只能消费 descriptor，不得把 descriptor 再次改写为新的流程定义。
6. `selected_surface` 继续保留为用户语义主键，但当 runtime 已解析到 transport / provider binding 时，replay truth 不得只剩 surface 名称。
7. capability snapshot 必须按 transport 计算，不允许把同一 surface 的 `cli_exec` 能力偷渡给 `remote_api` 路径。
8. fallback 决策必须能区分“surface 不可用”和“同 surface 的 remote_api binding 不可用”。
9. 当 `selected_transport` 来自显式 tool config 或 candidate config 时，projection / replay truth 必须把该 transport 视为 locked selection；同一 surface 内失败不得被自动重写为另一种 transport 的成功执行。
10. 如果 consumer 想建议 `switch_to_cli_exec` 或其他替代 route，只能通过 descriptor companion diagnostics / next-action surface 暴露，不得篡改当前 `AgentDescriptor` 的 canonical transport truth。
11. `selected_transport / selected_provider_kind / selected_vendor_binding_kind / selected_model` 可以来自 CLI 参数、workspace config 或 `user-config` 默认值，但前提是这些输入已先被 onboarding runtime 归一化为 canonical tool rows；raw `user-config` path 不得直接进入 `AgentDescriptor`。
12. `workspace_mode=repo_local` 只允许在 repo / workspace 未显式声明 `workspace.mode` 时由 `workspace.mode_preference` 派生；user-local preference 不得覆盖共享 workspace truth。

## 5. Provider Continuation Extension

`contract.runtime.agent-projection.v1` 进一步要求 adapter-facing stage invoke seam 可以表达 provider-native continuation reuse。最低 contract 事实如下：

1. `ProviderContinuationHandle`
   - `provider_id`
   - `surface`
   - `transport_kind`
   - `handle_kind`
   - `reference_value`
   - `acquired_at`
   - optional `model`
   - optional `metadata`
2. `AgentStageContinuationRequest`
   - `mode`
   - `session_id`
   - `lane_key`
   - `handle`
3. `AgentStageContinuationResult`
   - `status`
   - `lane_key`
   - optional `handle`
   - optional `invalidation_reason`
4. `AgentInvokeStageRequest` 与 `AgentStreamEventsRequest`
   - 允许 additive `continuation`
5. `AgentInvokeStageResult`
   - 允许 additive `continuation`

## 6. Continuation Allowed Values

1. `handle_kind`
   - `thread_id`
   - `response_id`
   - `conversation_id`
   - `message_id`
   - `opaque`
2. `mode`
   - `disabled`
   - `prefer_reuse`
   - `require_reuse`
3. `status`
   - `unsupported`
   - `created`
   - `reused`
   - `refreshed`
   - `cleared`
   - `invalid`

## 7. Continuation Required Constraints

1. adapter-facing continuation request/result seam 归 `runtime.agent-projection` 所有；`runtime.orchestration` 只负责 `lane_key` derivation、session slot lifecycle、policy/invalidation 与 turn-level continuation summary projection。
2. `reference_value` 只允许保存 non-secret provider reference；bearer-like token、可重放凭据或任何 secret material 禁止 inline 进入 shared session persistence。
3. `metadata` 只允许保存 audit-safe、presenter-safe、兼容性判断所需的最小非敏感字段。
4. `session_id` 可以随 request 一起透传，用于 trace、日志与调试，但不得被要求拼进 `lane_key` 本体，也不得被 adapter 当成 provider continuation identity。
5. runtime 只能根据显式 `status=created/reused/refreshed` 认定 continuation 成立；provider 返回的零散 `thread_id/message_id` 本身不等于正式支持 reuse。
6. `unsupported` 与 `invalid` 都必须允许 caller 安全退回 stateless turn；`require_reuse` 只能在未来显式场景下使用，默认策略仍应是 `prefer_reuse`。
7. `lane_key` 属于 caller-provided runtime boundary；adapter 不得把 provider 私有 thread 拓扑反向提升为 canonical lane identity。
8. 所有有限集合字段必须收口到集中 enum/constants；不得在实现里继续保留漂移的 inline string-literal union。

## 8. Compatibility

1. `v1` 允许 `AgentDescriptor` 由 CLI、report 与 diagnostics 共用。
2. `v1` 允许在不引入 UI 事实源的前提下，为后续桌面端提供同一份投影数据。
3. `v1` 允许 shared presenter/view-model 对 `selected_by`、`selected_surface`、`projection_status` 与 `failure_reasons` 做派生渲染，但不得把 presenter 结果反向写回 runtime truth。
4. `v1` 允许以 additive fields 扩展 `selected_transport`、`selected_provider_kind`、`selected_vendor_binding_kind`、`selected_model` 与 `capability_snapshot_source`，使旧 consumer 仍可只读取 `selected_surface`。
5. `v1` 允许以 additive `continuation` request/result 扩展 invoke/stream seams，只要旧 consumer 在未读取 continuation 字段时仍保持兼容。
6. `v1` 不要求所有 provider 与所有 transport 第一阶段都支持 continuation reuse；不支持时必须诚实返回 `unsupported`。
7. `v1` 目前只接受 non-secret inline provider reference；若某个 provider 只能返回敏感 continuation token，则在 secret-store reference seam formalized 之前应保持 unsupported。
8. `v1` 允许 companion diagnostics 以 additive fields 暴露 `transport_selection_source` 与 `transport_selection_locked`，只要 `AgentDescriptor` minimum fields 与 replay semantics 继续保持兼容。
