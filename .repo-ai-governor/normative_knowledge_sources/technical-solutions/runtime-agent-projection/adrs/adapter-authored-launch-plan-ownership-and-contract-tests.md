# Adapter Authored Launch Plan Ownership And Contract Tests ADR

- Status: active
- Date: 2026-04-13
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.adapter-authored-launch-plan-ownership-and-contract-tests.v1`

## 1. Context

shared native `cli_exec` runtime 已经把 `Codex`、`Claude Code` 与 `GitHub Copilot` 的 process ownership、termination 与 liveness 语义收敛到统一 owner 上，但 shared runtime 收敛之后仍有一个容易回归的边界需要长期 formalize：

`adapter 继续拥有 launch authoring truth，shared runtime 与 consumer surface 只消费 adapter-authored resolved launch plan。`

如果这条边界只停留在零散 smoke tests 或 rollout closeout 备注里，那么 parse failure、spawn failure、fallback entrypoint projection、non-zero exit 与 signal exit 等 failure-path 很容易把 `resolved_entrypoint`、`shell_strategy`、`process_tree_policy`、`request_cancellation_mode` 的 authoring truth 漂移成 shared runtime 或 consumer presentation 的隐式副作用。

## 2. Decision

1. `runtime.agent-projection` 正式拥有 adapter-authored launch-plan ownership guardrail，但该 guardrail 只 formalize shared invariant 与 contract-test taxonomy：
   - adapter-owned authoring truth：
     - `resolved_entrypoint`
     - `shell_strategy`
     - `process_tree_policy`
     - `request_cancellation_mode`
   - shared runtime / consumer 只能消费，不得反向成为新的 authoring owner
2. probe 与 invoke surface 的 preserved facts 必须显式拆开，而不是假设两条 surface 共享同一断言集合：
   - probe-visible preserved facts：
     - `selected_entrypoint`
     - `request_cancellation_mode`
   - invoke-visible preserved facts：
     - `terminate_phase`
     - `partial_output_preserved_when_available`
     - `cancel_mechanism`
   - additive launch evidence：
     - `shell_wrapped`
     - `process_tree_policy`
     - `spawn_error_code`
3. shared launch-authoring contract-test taxonomy 固定为：
   - `probe_launch_truth_projected`
   - `invoke_launch_truth_projected`
   - `probe_parse_failure_launch_truth_preserved`
   - `invoke_parse_failure_launch_truth_preserved`
   - `spawn_failure_launch_truth_preserved`
   - `non_zero_exit_launch_truth_preserved`
   - `signal_exit_launch_truth_preserved`
   - `termination_phase_projected`
   - `fallback_entrypoint_projection_preserved`
4. shared scenario coverage 必须与 active compatibility/stability baseline 保持对齐，不得缩窄为 happy-path only：
   - `probe_protocol_parse_failed`
   - `invoke_protocol_parse_failed`
   - `spawn_failed`
   - `non_zero_exit`
   - `signal_exit`
   - `timeout_soft_terminated`
   - `timeout_hard_terminated`
   - `abort_soft_terminated`
   - `abort_hard_terminated`
   - `fallback_resolved_entrypoint_projected`
5. 本 ADR 只 formalize shared ownership guardrail 与 contract-test governance：
   - 不新增新的 runtime behavior
   - 不把 additive launch diagnostics 升格为 minimum contract fields
   - 不扩展成全量 adapter test strategy
   - 不 supersede 已 active 的 `native-cli-exec-compatibility-and-stability-productization` ADR；两者并存，前者负责 ownership guardrail，后者负责 runtime compatibility baseline

## 3. Consequences

1. shared runtime 后续演进现在有了稳定的 launch-authoring regression vocabulary，不再依赖各 adapter 自己维护一套隐式 ownership 断言。
2. `adapter-health-and-route-probe` 与 `agent-invoke-liveness` 的 contract clarification 可以共享同一套“authoring truth vs preserved fact vs additive evidence”词汇，而不引入新的 minimum field。
3. 真正把 shared harness 落进 `packages/**` / `test/**` 的实现窗口继续留给 follow-up rollout stream 处理；本次 promotion 只完成 formal direction 与 delivery handoff。
