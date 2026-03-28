# Agent Onboarding Contract

- Status: active
- Date: 2026-03-28
- Contract ID: `contract.runtime.agent-onboarding.v1`
- Producer Module: `runtime.agent-projection`

## 1. 目标

定义多工具 onboarding 的最小 contract，使 `connect / doctor / verify` 能在不改变执行事实源的前提下，稳定生成角色绑定、工具矩阵、诊断结果与下一步动作。

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

## 4. Required Constraints

1. `connect` 可以生成或更新 `roles[] / adapters.tools / routing.roleBindings`，但不得自行修改执行事实源。
2. `doctor` 只允许执行 `safe_local` 修复；认证、网络、权限上限与发布相关动作只能输出 `next_action`。
3. `verify` 必须能回链 `execution_id`，并输出可用于 CI 的稳定诊断结果。
4. `dry_run=true` 时不得落盘修改。
5. `single_tool_all_roles=true` 只表示路由模板，不表示能力假设已被验证。

## 5. Output Semantics

1. `diagnostic_summary` 应能压缩为可读摘要，同时保留 machine 可消费字段。
2. `next_action` 必须是可执行建议，而不是泛化说明。
3. `verification_status=fail` 时，必须给出明确的修复方向或阻断原因。

## 6. Compatibility

1. `v1` 允许 onboarding 结果被 presenter 渲染为 `pretty/plain/json`，但不得改变 machine schema。
2. `v1` 允许 CLI 非交互场景直接输出 `plain` 或 `json`。
