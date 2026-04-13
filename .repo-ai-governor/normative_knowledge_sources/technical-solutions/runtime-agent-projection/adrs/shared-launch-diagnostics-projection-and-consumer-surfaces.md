# Shared Launch Diagnostics Projection And Consumer Surfaces ADR

- Status: active
- Date: 2026-04-13
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.shared-launch-diagnostics-projection-and-consumer-surfaces.v1`

## 1. Context

shared native `cli_exec` runtime 已经能够产出 launch-aware diagnostics，但 consumer surface 还没有统一的 formal reading path。当前 repo 同时存在两层命名与 carrier：

1. implementation carrier：
   - `AgentCliLaunchDiagnostics`
   - camelCase：`selectedEntrypoint`、`shellWrapped`、`processTreePolicy`、`spawnErrorCode`
2. formal contract vocabulary：
   - snake_case：`selected_entrypoint`、`request_cancellation_mode`
   - additive launch evidence：`shell_wrapped`、`process_tree_policy`、`spawn_error_code`

如果不把二者之间的映射与 consumer boundary formalize，`connect / doctor / verify / report` 很容易重新回到“从 stderr 与 error message 逆向猜 launch facts”的 brittle explain path。

## 2. Decision

1. formal canonical naming 固定保持 snake_case；camelCase `AgentCliLaunchDiagnostics` 只作为 implementation carrier，不得被提升为第二套 formal contract truth。
2. probe-side producer truth 继续保持现有边界：
   - top-level preserved facts：
     - `selected_entrypoint`
     - `request_cancellation_mode`
   - additive launch evidence：
     - `shell_wrapped`
     - `process_tree_policy`
     - `spawn_error_code`
3. `runtime.agent-projection` 允许为 onboarding / doctor / report 等 consumer surface 派生 additive `launch_diagnostics` companion，但该 companion 只允许机械映射现有 truth：
   - `selected_entrypoint`
   - `request_cancellation_mode`
   - `shell_wrapped`
   - `process_tree_policy`
   - `spawn_error_code`
   - `selected_entrypoint` 与 `request_cancellation_mode` 的 authoritative source 仍是 probe truth
   - `shell_wrapped`、`process_tree_policy`、`spawn_error_code` 仍保持 additive-only evidence
4. invoke/execution diagnostics 在本窗口只保留为 downstream consumer guidance：
   - `agent-invoke-liveness-contract` 不新增 minimum fields
   - timeout/abort 路径继续以 `terminate_phase`、`partial_output_preserved_when_available` 与 `cancel_mechanism` 为正式 invoke truth
5. scenario-to-consumer mapping 继续与 active compatibility/stability baseline 对齐：
   - `spawn_failed`、`probe_protocol_parse_failed`：必须可读 probe truth；若 additive launch evidence 存在，可进入 `launch_diagnostics` companion
   - `invoke_protocol_parse_failed`、`non_zero_exit`、`signal_exit`：report / execution diagnostics 可消费 additive launch evidence，但不反向定义新的 producer truth
   - `timeout_* / abort_*`：继续以 invoke liveness truth 为主，launch diagnostics 只作 explain 补强

## 3. Consequences

1. `connect / doctor / verify / report` 现在有了统一的 machine-readable launch diagnostics consumer vocabulary，而不是各自重新解析自由文本。
2. snake_case formal contract 与 camelCase implementation carrier 的关系被正式固定为单向映射，避免 promotion 时生成第二 truth source。
3. 真正将 `launch_diagnostics` consumer projection 落进 CLI/runtime surface 的实现窗口继续交给 `project-103-cli-exec-additive-diagnostics-consumer-rollout` 承接；本次 promotion 只完成 formal direction、delivery handoff 与 rollout decomposition。
