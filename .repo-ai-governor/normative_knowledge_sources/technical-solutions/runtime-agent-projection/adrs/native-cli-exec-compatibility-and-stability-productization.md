# Native CLI Exec Compatibility And Stability Productization ADR

- Status: active
- Date: 2026-04-13
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.native-cli-exec-compatibility-and-stability-productization.v1`

## 1. Context

`project-098-cli-exec-runtime-rollout` 已经完成 shared native `cli_exec` runtime convergence，并把 `Codex`、`Claude Code` 与 `GitHub Copilot` 的核心 runtime 路径收敛到了统一的 process owner 上。当前缺口不再是“有没有 shared runtime”，而是“shared runtime 如何形成长期稳定、可审计、可重复执行的 compatibility baseline”。

如果后续继续只把这类 evidence 留在 rollout closeout 里，那么 upstream CLI 的 protocol drift、spawn failure、malformed output、timeout/abort phase transition 等 failure-path regression 仍会重新退回分散的 adapter-local 经验，而不是可复用的 runtime truth。

## 2. Decision

1. `runtime.agent-projection` 正式拥有 native `cli_exec` compatibility/stability runtime guidance，但该 guidance 仍停留在 runtime producer truth：
   - 不新增 public transport value
   - 不 formalize ACP host-facing transport
   - 不将 compatibility profiles 升格为 `governance.execution-gates` formal truth
2. compatibility baseline 固定采用 `scenario class x required preserved facts` taxonomy。
   - scenario class:
     - `spawn_failed`
     - `probe_protocol_parse_failed`
     - `invoke_protocol_parse_failed`
     - `non_zero_exit`
     - `signal_exit`
     - `timeout_soft_terminated`
     - `timeout_hard_terminated`
     - `abort_soft_terminated`
     - `abort_hard_terminated`
   - required preserved facts:
     - `launch_diagnostics_preserved`
     - `adapter_launch_truth_projected`
     - `terminate_phase_preserved`
     - `partial_output_preserved_when_available`
3. preserved facts 的正式解释固定为：
   - `launch_diagnostics_preserved`：仍能保住 `selected_entrypoint`、`request_cancellation_mode` 以及 additive launch diagnostics 中本应可见的部分
   - `adapter_launch_truth_projected`：shared runtime 不得吞并 adapter-authored `resolved_entrypoint`、`shell_strategy`、`process_tree_policy` 与 `request_cancellation_mode`
   - `terminate_phase_preserved`：timeout / abort 路径必须继续机械投影 `soft / hard` terminate 语义
   - `partial_output_preserved_when_available`：只有在已有 assistant draft / semantic progress 时才要求保住 partial snapshot
4. focused verification guidance 固定为三档 profile：
   - `cli_exec_compatibility_full`
   - `cli_exec_compatibility_runtime_foundation`
   - `cli_exec_compatibility_adapter_slice`
5. canonical profile commands 固定为：

```bash
pnpm exec vitest run \
  packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts \
  packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts \
  packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts \
  packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts \
  packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts \
  apps/cli/test/runtime/agent-onboarding-runtime.test.ts \
  apps/cli/test/runtime/adapter-verification-runtime.test.ts \
  apps/cli/test/runtime/adapter-routing-runtime.test.ts \
  apps/cli/test/connect-phase2.integration.test.ts
```

```bash
pnpm exec vitest run \
  packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts \
  packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts \
  packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts \
  packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts \
  packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts
```

```bash
pnpm exec vitest run \
  packages/adapters/<touched-adapter>/test/<touched-adapter>-agent-adapter.smoke.test.ts
```

6. trigger matrix 固定为：
   - shared runtime owner、shared lifecycle/termination logic、launch-diagnostics consumer 改动：`cli_exec_compatibility_full`
   - cross-adapter shared runtime / parser changes in the same window: `cli_exec_compatibility_runtime_foundation`
   - single-adapter parser / malformed-output branch changes，且 shared runtime 与 consumer projection 未改动：`cli_exec_compatibility_adapter_slice`
   - closeout / promotion claim 需要证明 native `cli_exec` baseline 仍健康：`cli_exec_compatibility_full`
7. additive boundary 保持不变：
   - `partial_output_preserved`
   - `selected_entrypoint`
   - `request_cancellation_mode`
   - `shell_wrapped`
   - `process_tree_policy`
   - `spawn_error_code`
   继续作为 additive / optional truth，不升级为新的 minimum contract 字段。

## 3. Consequences

1. native `cli_exec` runtime 的后续变更现在拥有稳定的 regression vocabulary，不再只依赖零散 smoke/unit evidence。
2. `project-098` 的 rollout evidence 被提升成长期 runtime guidance，但不自动变成公共 gate 或 public support truth。
3. ACP host-facing/public transport 与 gate-execution formalization 仍保持为独立 solution track，不会在本 ADR 中被隐式合并。
