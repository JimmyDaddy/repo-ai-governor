# Native CLI Exec Runtime Hardening And Explicit ACP Extension Seam ADR

- Status: active
- Date: 2026-04-13
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.v1`

## 1. Context

`Codex`、`Claude Code` 与 `GitHub Copilot` 当前都走 native `cli_exec`，但 process launch、timeout、abort、partial-output retention、stderr diagnostics 与 process-tree cleanup 仍分散在各 adapter 内重复实现。与此同时，`runtime.agent-projection` 已正式拥有 transport selection authority、invoke-liveness、route probe 与 continuation seam，这意味着当前真正缺失的不是“再引一个隐式 transport”，而是“把 native `cli_exec` 的共享 process runtime owner 正式补齐”。

外部 ACP 参考实现证明了 protocol isolation、event bus、permission queue、terminal manager 与 host-aware process handling 的价值，但它依赖额外 adapter process 与协议握手，并不等价于当前仓库的 native `cli_exec` canonical truth。如果直接把 ACP 包进 `cli_exec`，就会破坏现有 transport truthfulness 与 fail-closed 边界。

## 2. Decision

1. 保留 native `cli_exec` 作为当前 canonical transport；本 ADR 不引入新的 minimum transport value，也不允许把 ACP path 静默包装成 `cli_exec` 成功结果。
2. 为 shared native runtime 固定 adapter-authored `resolved launch plan` seam，最小 authoring truth 包括：
   - `resolved_entrypoint`
   - `args`
   - `cwd`
   - `env`
   - `stdin_text`
   - `timeout_ms`
   - `graceful_terminate_grace_ms`
   - `output_retention_policy`
   - `process_tree_policy`
   - `shell_strategy`
   - `request_cancellation_mode`
3. shared runtime 只拥有 process lifecycle、partial-output checkpoint、soft/hard terminate、process-tree termination 与 structured spawn/exit diagnostics；command resolution、shell wrapping decision、parser、route/capability truth 与 semantic-progress judgement 继续留在 adapter。
4. shared runtime 必须显式提供 lifecycle observer seam，而不是只返回终态 process result：
   - `onLifecycleEvent(event)`
   - `onLifecycleSnapshot(snapshot)`
   - adapter parser 通过 `markSemanticProgress()` 回灌真实语义推进
5. `entrypoint_resolution`、`shell_wrapped`、`process_tree_policy`、`spawn_error_code` 等 launch facts 只作为 additive diagnostics 出现，不升级为当前 contract 的 minimum fields。
6. ACP 只能作为 explicit、non-default、non-public extension seam 存在；若未来要引入 host-facing ACP surface、distribution contract、support-matrix wording uplift 或新的 canonical transport value，必须先新建独立 technical solution。

## 3. Consequences

1. `Codex` 已有的 lifecycle observer / partial snapshot / dual-stage terminate 语义可以成为 cross-adapter shared owner，而不是继续作为单 adapter 特例存在。
2. `Claude Code` 与 `GitHub Copilot` 可以复用同一条 native runtime seam，但仍保留各自 parser、capability、route 与 command authoring truth。
3. `packages/adapter-sdk` 只承担实现级共享载体，不会演变成第二条 formal technical-solution truth source。
4. future ACP work 仍有清晰落点，但它必须以 explicit seam 或独立 solution 的方式推进，而不是在本轮 rollout 中隐式扩 scope。
5. rollout phase order 固定为：
   - shared runtime foundation
   - cross-adapter hardening and diagnostics evidence
   - explicit ACP seam guardrails and closeout
