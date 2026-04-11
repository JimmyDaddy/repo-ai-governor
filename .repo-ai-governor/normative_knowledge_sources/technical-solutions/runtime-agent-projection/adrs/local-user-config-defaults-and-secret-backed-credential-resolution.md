# Local User Config Defaults And Secret-Backed Credential Resolution ADR

- Status: active
- Date: 2026-04-11
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.local-user-config-defaults-and-secret-backed-credential-resolution.v1`

## 1. Context

`technical-solution.api-key-remote-adapter-invocation` 已 formalize `remote_api`、`credentialRef` 与 provider binding seam，但当前仓库仍缺两类正式边界：

1. 用户如何在不改共享 `governor.yaml` 的前提下 author 本机私有默认值，例如默认 `workspace.mode`、默认 `remote_api` provider/model/endpoint 与默认 `credentialRef`；
2. runtime 如何把这些 user-local authoring facts 继续收敛回既有 `enabled_tools[] / configured_remote_api / AgentDescriptor.selected_*` canonical truth，而不是再长出一套 command-surface 私有字段。

与此同时，用户还需要通过命令安全地设置 API key，但 `connect / doctor / verify` 继续承担 analyze-first / read-only onboarding 角色，不能静默写入 keychain、credential manager 或 provider-owned config。

## 2. Decision

1. 采用三层边界：
   - shared governance truth 继续由 repo-local / tool-managed workspace 下的 `governor.yaml` 承担；
   - user-local default authoring 固定收敛到 `~/.repo-ai-governor/user-config.yaml`；
   - secret value 默认进入 OS keychain / credential helper，只有显式 opt-in 时才允许 unsafe local-file fallback。
2. `runtime.agent-projection` 正式拥有 `user-config.yaml` 到 canonical onboarding / projection truth 的 normalization seam：
   - `tools.<surface>.remoteApi.*` 只是 authoring path；
   - runtime 输出仍固定使用 `enabled_tools[]`、`configured_remote_api` 与 `AgentDescriptor.selected_*`；
   - raw authoring path 不得升格为第二事实源。
3. 优先级固定为：
   - CLI 显式参数
   - workspace `governor.yaml`
   - `user-config.yaml`
   - built-in defaults
4. `workspace.mode_preference` 只表示 user-local default，不得覆盖 repo / workspace 已显式声明的 `workspace.mode`。
5. `credentialRef` 继续作为 selector truth；当 runtime 需要真实 secret 时，只允许通过 secret backend 做 read-only resolution。
6. 若 `credentialRef` 对应 secret 缺失，`connect / doctor / verify` 必须 fail-closed 并输出 `create_credential_ref` 或等价 `secret set/import` guidance，而不是在 analyze-first 流程里隐式修复。
7. `runtime.governance-clients` 作为 companion consumer module，正式拥有 `config` / `secret` command family、session shell discoverability 与 host-facing authoring UX；但它不拥有 canonical runtime truth。

## 3. Consequences

1. 用户可以安全地把默认 model/provider/endpoint/credential selector 保存在本机私有层，而不会污染共享 `governor.yaml`。
2. API key 等真实 secret 与 selector truth 彻底分层：selector 可进入 `user-config.yaml` 或共享 config，secret value 只进入 secret backend。
3. `connect / doctor / verify` 继续共享既有 transport-aware canonical truth，不需要引入第二套 command-surface schema。
4. `config` / `secret` command family 可以作为正式 user-facing surface 演进，但它们仍受 `runtime.agent-projection` 的 canonical normalization boundary 约束。
5. public docs / support wording 是否提升，仍取决于后续 delivery evidence；本 ADR 只 formalize producer truth 与 read-only consumption seam。
