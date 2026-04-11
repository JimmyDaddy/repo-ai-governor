# Agent Onboarding Contract

- Status: active
- Date: 2026-04-11
- Contract ID: `contract.runtime.agent-onboarding.v1`
- Producer Module: `runtime.agent-projection`

## 1. 目标

定义多工具 onboarding 的最小 contract，使 `connect / doctor / verify` 能在不改变执行事实源的前提下，稳定生成角色绑定、工具矩阵、transport-aware 诊断结果与下一步动作。

## 2. Minimum Fields

1. `schema_version`
2. `command_name`
3. `preset_id`
4. `enabled_tools[]`
5. `role_bindings[]`
6. `dry_run`
7. `overwrite`
8. `single_tool_all_roles`
9. `repair_scope`
10. `verification_status`
11. `diagnostic_summary`
12. `next_action`
13. `execution_id`
14. `workspace_id`
15. `next_actions[]`

## 3. Allowed Values

1. `command_name`
   - `connect`
   - `doctor`
   - `verify`
2. `repair_scope`
   - `safe_local`
   - `manual_only`
3. `verification_status`
   - `pass`
   - `warn`
   - `fail`
4. `next_action` / `next_actions[]`
   - `install_cli`
   - `set_api_key_env`
   - `create_credential_ref`
   - `switch_to_cli_exec`
   - `switch_surface_to_github-models`
   - `run_provider_login`

## 4. Required Constraints

1. `connect` 可以生成或更新 `roles[] / adapters.tools / routing.roleBindings`，但不得自行修改执行事实源。
2. `doctor` 只允许执行 `safe_local` 修复；认证、网络、权限上限与发布相关动作只能输出 `next_action`。
3. `verify` 必须能回链 `execution_id`，并输出可用于 CI 的稳定诊断结果。
4. `dry_run=true` 时不得落盘修改。
5. `single_tool_all_roles=true` 只表示路由模板，不表示能力假设已被验证。
6. `connect` 可以输出 candidate config、fingerprint、diff summary 与 merge explain companion artifacts，但默认仍是 non-mutating analyze-first surface。
7. 若存在显式 candidate-application surface，它只能消费已生成的 candidate artifact，不得在写回前静默重算 candidate。
8. `enabled_tools[]` row 必须显式带出 `transport_kind`；只有 `baseline / cli_exec` row 才允许 `provider_kind` 与 `vendor_binding_kind` 为 `null`。
9. 当 tool row 显式声明 `transport` 时，`enabled_tools[]` 必须把该 `transport_kind` 作为 authoritative selection 原样投影；同一 surface 的其他 transport 不得被投影为本次成功结果的等价替身。
10. 当 `connect` 生成 `remote_api` candidate config 时，必须 materialize `transport`、`remoteApi.provider`、`remoteApi.vendorBinding`、`remoteApi.model` 以及 credential / endpoint selector。
11. 当默认值来自 `~/.repo-ai-governor/user-config.yaml` 时，CLI 显式参数与活动 workspace `governor.yaml` 仍保持更高优先级；`user-config.yaml` 只能补齐缺失默认值，不得覆盖 repo / workspace 已显式声明的治理真值。
12. `user-config.yaml` 可以使用 authoring-friendly path（例如 `workspace.mode_preference`、`tools.<surface>.remoteApi.*`），但 contract payload 只能暴露已归一化的 canonical truth：`enabled_tools[]`、`configured_remote_api` 与兼容期 derived alias；不得把 raw authoring path 升格为第二事实源。
13. `enabled_tools[]` 应允许稳定带出 `transport_selection_source`、`transport_selection_locked` 与 `configured_remote_api`；其中 `transport_selection_locked=true` 仅表示当前 row 已显式声明 `transport`。
14. 若兼容期仍输出 `tool_transport_matrix`，它必须完全由 `enabled_tools[]` 机械派生，不得承载额外 canonical truth；`remote_api_candidate` 只允许作为 `configured_remote_api` 的 compatibility alias。
15. `connect / doctor / verify` 可以做 repo config、env、`credentialRef`、provider-local config 与官方 auth path 的 read-only discovery，但不得静默写入 keychain、credential manager 或 provider-owned config。
16. 认证修复、secret 创建更新、provider login 与 transport 切换必须通过显式 `next_action` / `next_actions[]` 暴露，而不是在 analyze-first 路径中隐式完成。

## 5. Output Semantics

1. `diagnostic_summary` 应能压缩为可读摘要，同时保留 machine 可消费字段。
2. `next_action` 必须是可执行建议，而不是泛化说明。
3. `verification_status=fail` 时，必须给出明确的修复方向或阻断原因。
4. `connect` 相关输出应允许 companion artifact 提供 `source_config_hash`、`candidate_config_hash`、`diff_summary` 与 `merge_explain`，但不得改变 contract payload 的稳定 machine shape。
5. `enabled_tools[]` 应允许稳定表达 `transport_kind`、`provider_kind`、`vendor_binding_kind`、`model`、`credential_mode`、`endpoint_source`、`transport_selection_source`、`transport_selection_locked` 与 `configured_remote_api`，供 presenter 与 routing consumer 共享同一真值。
6. 当 `remote_api.vendorBinding` 在用户配置中省略时，onboarding runtime 必须先把其解析为确定的 `vendor_binding_kind` 再输出；无法唯一解析时必须 fail-closed。
7. 当显式选择的 transport 不可用时，contract payload 必须保留失败的 `transport_kind` 真值，并通过 `next_actions[]` 给出显式切换建议，而不是在 payload 内回写同 surface 的替代 transport。
8. 当 `credentialRef` 来自 `user-config.yaml` 或 workspace config 但 secret backend 中尚不存在对应 secret 时，payload 必须保留 `credential_mode=credential_ref` 的 candidate truth，并通过 `create_credential_ref` 或等价 `secret set/import` guidance 暴露修复方向，而不是在 onboarding 流程里隐式创建 secret。
9. `workspace.mode_preference` 只允许在 repo / workspace 未显式声明 `workspace.mode` 时参与 candidate 生成；一旦上层已有显式 mode，onboarding payload 不得把 user-local preference 反向投影为 canonical workspace truth。

## 6. Compatibility

1. `v1` 允许 onboarding 结果被 presenter 渲染为 `pretty/plain/json`，但不得改变 machine schema。
2. `v1` 允许 CLI 非交互场景直接输出 `plain` 或 `json`。
3. `v1` 允许 candidate diff / merge explain / apply receipt 作为 companion artifact 存在，只要默认 `connect` contract 仍保持 non-mutating。
4. `v1` 允许通过 additive nested fields 扩展 `enabled_tools[]` 与 candidate config，使 CLI-only row 继续以 `transport_kind=cli_exec`、`provider_kind=null`、`vendor_binding_kind=null` 表达，同时稳定带出 `transport_selection_source`、`transport_selection_locked` 与 `configured_remote_api`，而不需要升级到 `v2`。
5. `v1` 允许兼容期保留 `tool_transport_matrix.remote_api_candidate` 作为 derived alias，只要 canonical truth 已回收到 `enabled_tools[]` 与 `configured_remote_api`。
