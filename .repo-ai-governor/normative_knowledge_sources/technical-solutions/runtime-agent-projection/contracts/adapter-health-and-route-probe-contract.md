# Adapter Health And Route Probe Contract

- Status: active
- Date: 2026-04-13
- Contract ID: `contract.runtime.adapter-health-check.v1`
- Producer Module: `runtime.agent-projection`

## 1. 目标

定义 adapter health check 与 route capability probe 的最小 machine contract，使 `connect / doctor / verify`、role routing 与 fallback 逻辑可以共享同一套 install/auth/protocol/semantic/route-capability 诊断事实。

## 2. Minimum Fields

1. `adapter_id`
2. `surface_id`
3. `probe_timestamp`
4. `install_status`
5. `auth_status`
6. `protocol_status`
7. `semantic_status`
8. `route_capability_status`
9. `overall_status`
10. `reason_codes[]`
11. `diagnostics[]`
12. `selected_entrypoint`
13. `route_key`
14. `route_requirements[]`
15. `fallback_allowed`
16. `transport_kind`
17. `provider_kind`
18. `vendor_binding_kind`
19. `model`
20. `credential_source`
21. `endpoint_source`
22. `request_cancellation_mode`

## 3. Allowed Values

1. `install_status`
2. `auth_status`
3. `protocol_status`
4. `semantic_status`
5. `route_capability_status`
   - `pass`
   - `warn`
   - `fail`
6. `overall_status`
   - `available`
   - `degraded`
   - `unavailable`
7. `request_cancellation_mode`
   - `not_supported`
   - `local_abort_only`
   - `provider_cancel_attempted`

## 4. Required Constraints

1. health check 结果必须显式区分 `install / auth / protocol / semantic / route_capability` 五层，不得再把所有失败压缩成单个文本回声布尔值。
2. 文本 no-op probe 如果存在，只能作为 `semantic_status` 的次级信号，不得单独决定 surface overall availability。
3. route fallback 必须优先基于稳定 `reason_codes[]` 与 `route_capability_status`，而不是基于 stderr 文案或标点差异做字符串特判。
4. 不同 adapter 可以使用不同的底层探测方式，但归一化后的 contract payload 必须保持一致。
5. `doctor` 与 `verify` 必须能够直接消费该 contract，而不需要再反向解析 adapter 私有 stdout。
6. `diagnostics[]` 必须允许保留 adapter-specific 细节，但不得破坏稳定顶层字段。
7. route fallback 必须把 `transport_kind / provider_kind / vendor_binding_kind` 一起纳入真值，不得再把同一 surface 的不同 transport 混为单一 availability。
8. 当 `remote_api` binding 无法唯一解析或与 surface 不匹配时，probe 必须以结构化 reason code fail-closed，而不是静默退回默认 binding。
9. 当 route input 已显式锁定 `transport_kind` 时，probe 只允许针对该 transport 生成 availability truth；同一 surface 的其他 transport 成功结果不得覆盖这次失败。
10. `fallback_allowed` 只能表达 route consumer 是否可继续尝试其他 surface；若 presenter 想建议 `switch_to_cli_exec`，那只能作为 follow-up next action，而不是 probe runtime 的隐式重试。
11. 当 probe / diagnostics 复用 shared native `cli_exec` runtime 时，`selected_entrypoint` 与 `request_cancellation_mode` 仍必须从 adapter-authored launch plan 机械投影；shared runtime 只能补结构化 launch diagnostics，不得反向改写 route truth。
12. 当 native `cli_exec` compatibility baseline 评估 `spawn_failed` 或 `probe_protocol_parse_failed` 时，`selected_entrypoint` 与 `request_cancellation_mode` 仍必须被视为 preserved fact；`shell_wrapped`、`process_tree_policy`、`spawn_error_code` 等 launch evidence 继续保持 additive / optional truth，缺失时不得被提升为失败或 minimum field。
13. 当 shared launch-authoring contract tests 评估 probe surface 时，probe-visible preserved facts 固定为 `selected_entrypoint` 与 `request_cancellation_mode`；`shell_wrapped`、`process_tree_policy` 与 `spawn_error_code` 只作为 additive launch evidence 参与断言，不得被误提升为 probe minimum fields。
14. 当 probe producer 为 onboarding / doctor / report 等 consumer materialize `launch_diagnostics` companion 时，该 companion 必须机械派生自本 contract 已有的 top-level preserved facts 与 additive evidence：
   - `selected_entrypoint`、`request_cancellation_mode` 来自 probe-owned preserved facts
   - `shell_wrapped`、`process_tree_policy`、`spawn_error_code` 只来自 additive evidence
   - companion 缺失或字段缺失都不得改变 `overall_status`、`route_capability_status` 或 minimum-field posture
15. 本 contract 继续只拥有 layered probe truth、reason codes 与 probe-visible preserved facts；`verification_status`、`diagnostic_summary`、`next_action(s)` 等 readiness summary 必须由 onboarding contract 组合，不得反向写回本 payload 成为新的 probe minimum fields。
16. local adoption / support consumer 若要消费 probe truth，只能通过 canonical onboarding/projection path 渲染既有事实；不得把 probe result 自行升级为新的 support wording、success truth 或 transport rewrite。

## 5. Output Semantics

1. `install_status=fail` 应表达命令缺失、endpoint 不可达或 entrypoint 不存在。
2. `auth_status=fail` 应表达未登录、token 缺失、host/tenant 不匹配、unauthorized/forbidden 等认证或会话前置条件失败。
3. `protocol_status=fail` 应表达进程虽能启动但输出无法解析、schema 不满足或缺少终态事件。
4. `semantic_status=warn/fail` 应表达轻量 no-op probe 的语义回声异常；`OK.`、空白和简单包裹差异应被视为 trivial variant，而不是 install/auth failure。
5. `route_capability_status=fail` 应表达 adapter 当前不满足 reviewer/tester 等 route 的工具、权限、超时或 policy 约束。
6. `overall_status=degraded` 允许表示“基础聊天可用，但当前 route 不可用”或“核心能力可用但诊断存在轻微风险”。
7. `credential_source` 与 `endpoint_source` 应帮助 consumer 区分 repo 显式配置、env override、secret store、provider-local discovery 与 vendor default。
8. `request_cancellation_mode=local_abort_only` 表示 Governor 只能保证本地 stream / request 已发出 abort，而不默认宣称 provider 端任务已被强取消。
9. 当当前尝试来自显式 transport 选择时，diagnostics 应让 consumer 可区分 `config_explicit`、`inferred_from_remote_api` 与 `surface_default` 三种选择来源。
10. `diagnostics[]` 可以 additive 方式带出 `entrypoint_resolution`、`shell_wrapped`、`process_tree_policy`、`spawn_error_code` 等 launch evidence；这些字段的缺失不得被解释为失败，也不得把它们升级成 `v1` minimum fields。
11. consumer 若需要统一 machine-readable explain payload，可以 additive 方式从本 contract 派生 snake_case `launch_diagnostics` companion，但 `selected_entrypoint` 与 `request_cancellation_mode` 的 authoritative source 仍是 top-level preserved facts，其他 launch evidence 仍保持 additive-only truth。
12. local adoption 或 troubleshooting consumer 可以把 `reason_codes[]`、`diagnostics[]` 与 additive `launch_diagnostics` 渲染为 operator guidance，但必须保留显式 surface/transport failure truth，不得把 `overall_status` 自行翻译成 public support claim。

## 6. Stable Reason Codes

1. `cli_missing`
2. `credential_missing`
3. `credential_invalid`
4. `endpoint_unreachable`
5. `provider_rate_limited`
6. `provider_quota_exhausted`
7. `model_capability_missing`
8. `provider_binding_mismatch`
9. `vendor_binding_required`

## 7. Compatibility

1. `v1` 允许 `Codex`、`GitHub Copilot`、`Claude Code` 与 `Ollama` 各自保留不同的 probe 实现，只要最终能投影为同一 contract。
2. `v1` 允许在 rollout 早期分阶段接入：先统一 shared normalization，再逐步替换 adapter-specific auth/protocol probe。
3. `v1` 允许 route probe 继续复用现有 role binding / descriptor 结构，但 route 诊断必须能稳定回链 `route_key` 与 `surface_id`。
4. `v1` 允许 CLI-only row 继续表达 `transport_kind=cli_exec` 与 `provider_kind/vendor_binding_kind=null`，同时对 `remote_api` row 增量补充 binding-aware 字段。
5. `v1` 允许 shared native `cli_exec` runtime 为多个 adapter 供给 additive launch diagnostics，只要这些字段仍保持 optional truth，且 adapter-owned authoring 边界没有被共享层吞并。
6. `v1` 允许 `runtime.agent-projection` 以 runtime guidance 形式 formalize `spawn_failed` 与 protocol-parse failure 的 compatibility taxonomy，但该 guidance 不能把 additive diagnostics 升格为新的 minimum contract 字段，也不能替代独立的 gate truth formalization。
7. `v1` 允许 shared launch-authoring contract harness 把 `spawn_failed`、`probe_protocol_parse_failed` 与 fallback entrypoint projection 作为统一 probe ownership 场景，只要 probe surface 仍保持机械投影而非反向拥有 authoring truth。
8. `v1` 允许从本 contract 派生 additive `launch_diagnostics` consumer projection，只要 snake_case naming、probe-owned preserved facts 与 additive-only evidence 的边界保持不变，且不把 companion 升格为新的 minimum field。
9. `v1` 允许 probe truth 参与 `connect / doctor / verify / local adoption` 的 readiness evidence chain，只要本 contract 继续保持 canonical facts source，而 onboarding surface 仍是 user-facing readiness summary 与 action composition 的唯一 owner。
