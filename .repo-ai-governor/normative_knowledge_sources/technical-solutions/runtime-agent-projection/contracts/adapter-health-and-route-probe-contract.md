# Adapter Health And Route Probe Contract

- Status: active
- Date: 2026-04-02
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

## 4. Required Constraints

1. health check 结果必须显式区分 `install / auth / protocol / semantic / route_capability` 五层，不得再把所有失败压缩成单个文本回声布尔值。
2. 文本 no-op probe 如果存在，只能作为 `semantic_status` 的次级信号，不得单独决定 surface overall availability。
3. route fallback 必须优先基于稳定 `reason_codes[]` 与 `route_capability_status`，而不是基于 stderr 文案或标点差异做字符串特判。
4. 不同 adapter 可以使用不同的底层探测方式，但归一化后的 contract payload 必须保持一致。
5. `doctor` 与 `verify` 必须能够直接消费该 contract，而不需要再反向解析 adapter 私有 stdout。
6. `diagnostics[]` 必须允许保留 adapter-specific 细节，但不得破坏稳定顶层字段。

## 5. Output Semantics

1. `install_status=fail` 应表达命令缺失、endpoint 不可达或 entrypoint 不存在。
2. `auth_status=fail` 应表达未登录、token 缺失、host/tenant 不匹配、unauthorized/forbidden 等认证或会话前置条件失败。
3. `protocol_status=fail` 应表达进程虽能启动但输出无法解析、schema 不满足或缺少终态事件。
4. `semantic_status=warn/fail` 应表达轻量 no-op probe 的语义回声异常；`OK.`、空白和简单包裹差异应被视为 trivial variant，而不是 install/auth failure。
5. `route_capability_status=fail` 应表达 adapter 当前不满足 reviewer/tester 等 route 的工具、权限、超时或 policy 约束。
6. `overall_status=degraded` 允许表示“基础聊天可用，但当前 route 不可用”或“核心能力可用但诊断存在轻微风险”。

## 6. Compatibility

1. `v1` 允许 `Codex`、`GitHub Copilot`、`Claude Code` 与 `Ollama` 各自保留不同的 probe 实现，只要最终能投影为同一 contract。
2. `v1` 允许在 rollout 早期分阶段接入：先统一 shared normalization，再逐步替换 adapter-specific auth/protocol probe。
3. `v1` 允许 route probe 继续复用现有 role binding / descriptor 结构，但 route 诊断必须能稳定回链 `route_key` 与 `surface_id`。
