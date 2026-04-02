# Agent Onboarding Contract

- Status: active
- Date: 2026-04-02
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
9. 当 `connect` 生成 `remote_api` candidate config 时，必须 materialize `transport`、`remoteApi.provider`、`remoteApi.vendorBinding`、`remoteApi.model` 以及 credential / endpoint selector。
10. `connect / doctor / verify` 可以做 repo config、env、`credentialRef`、provider-local config 与官方 auth path 的 read-only discovery，但不得静默写入 keychain、credential manager 或 provider-owned config。
11. 认证修复、secret 创建更新、provider login 与 transport 切换必须通过显式 `next_action` / `next_actions[]` 暴露，而不是在 analyze-first 路径中隐式完成。

## 5. Output Semantics

1. `diagnostic_summary` 应能压缩为可读摘要，同时保留 machine 可消费字段。
2. `next_action` 必须是可执行建议，而不是泛化说明。
3. `verification_status=fail` 时，必须给出明确的修复方向或阻断原因。
4. `connect` 相关输出应允许 companion artifact 提供 `source_config_hash`、`candidate_config_hash`、`diff_summary` 与 `merge_explain`，但不得改变 contract payload 的稳定 machine shape。
5. `enabled_tools[]` 应允许稳定表达 `transport_kind`、`provider_kind`、`vendor_binding_kind`、`model`、`credential_mode` 与 `endpoint_source`，供 presenter 与 routing consumer 共享同一真值。
6. 当 `remote_api.vendorBinding` 在用户配置中省略时，onboarding runtime 必须先把其解析为确定的 `vendor_binding_kind` 再输出；无法唯一解析时必须 fail-closed。

## 6. Compatibility

1. `v1` 允许 onboarding 结果被 presenter 渲染为 `pretty/plain/json`，但不得改变 machine schema。
2. `v1` 允许 CLI 非交互场景直接输出 `plain` 或 `json`。
3. `v1` 允许 candidate diff / merge explain / apply receipt 作为 companion artifact 存在，只要默认 `connect` contract 仍保持 non-mutating。
4. `v1` 允许通过 additive nested fields 扩展 `enabled_tools[]` 与 candidate config，使 CLI-only row 继续以 `transport_kind=cli_exec`、`provider_kind=null`、`vendor_binding_kind=null` 表达，而不需要升级到 `v2`。
