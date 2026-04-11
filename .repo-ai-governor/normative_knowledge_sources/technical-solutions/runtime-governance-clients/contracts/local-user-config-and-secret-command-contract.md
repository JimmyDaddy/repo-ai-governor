# Local User Config And Secret Command Contract

- Status: active
- Date: 2026-04-11
- Contract ID: `contract.runtime.governance-local-config-and-secret-command.v1`
- Producer Module: `runtime.governance-clients`

## 1. 目标

定义用户级私有 `config` / `secret` command family 与 session shell discoverability 的最小 contract，使宿主 surface 可以安全 author `user-config.yaml` 默认值与 secret backend mutation request，同时保持 canonical runtime truth 仍由 `runtime.agent-projection` 统一消费。

## 2. Minimum Capability Fields

1. `command_family`
2. `action`
3. `scope`
4. `mutation_target`
5. `config_path`
6. `secret_backend`
7. `secret_key_name`
8. `secret_input_mode`
9. `precedence_slot`
10. `next_action`

## 3. Allowed Values

1. `command_family`
   - `config`
   - `secret`
   - `session_shell_shortcut`
2. `action`
   - `get`
   - `set`
   - `unset`
   - `list`
   - `status`
   - `import`
   - `delete`
   - `discoverability`
3. `scope`
   - `user_local`
4. `mutation_target`
   - `user_config`
   - `secret_backend`
   - `guidance_only`
5. `secret_input_mode`
   - `stdin`
   - `no_echo_prompt`
   - `env_import`
   - `none`
6. `precedence_slot`
   - `user_default_only`

## 4. Required Constraints

1. `config` command family 的 canonical file path 固定为 `~/.repo-ai-governor/user-config.yaml`；读取时可以兼容历史 `cli-preferences.yaml`，但写入时必须迁移到 canonical path。
2. `config` 只负责 user-local private defaults，例如 `workspace.mode_preference`、`ui.react.theme` 与 `tools.<surface>.remoteApi.*`；默认不得改写共享 `governor.yaml`。
3. `secret` command family 只允许把真实 secret 写入 secret backend；`user-config.yaml` 与 `governor.yaml` 只能保存 `credentialRef` 这类 selector truth，不得保存明文 secret。
4. `secret set` 不允许通过位置参数接收明文 secret；只允许 `stdin`、no-echo 交互输入或 `env_import`。
5. session shell `/config` 与 `/secret` 只承担 discoverability / handoff affordance，不得形成第二份 canonical config state。
6. `config` / `secret` surface 必须明确告知 precedence boundary：CLI 显式参数与 workspace `governor.yaml` 高于 `user-config.yaml`；user-local defaults 只能补默认值。
7. 默认 secret backend 应优先使用 OS keychain / credential helper；`unsafe-local-file` 一类 fallback backend 只允许在显式 opt-in 且高噪声警告下使用。
8. host-facing command surface 负责 authoring UX、copy 与 guidance，但 canonical normalization、`credentialRef` read-only resolution 与 `AgentDescriptor.selected_*` projection 仍归 `runtime.agent-projection` 所有。

## 5. Consumers

1. `apps/cli`
2. `runtime.cli-interactive-shell`
3. future `apps/desktop`
4. future `VS Code extension`
5. `runtime.agent-projection`

## 6. Compatibility

1. `v1` 允许先以 CLI-first 形态交付 `config` / `secret` command family，再逐步扩展 session shell discoverability。
2. `v1` 允许 desktop / VS Code 只消费相同 command contract 与 guidance copy，而不要求首轮实现完整的 GUI configuration workbench。
3. `v1` 允许各平台 secret backend 以不同节奏 rollout，只要 default backend、unsafe fallback warning 与 precedence boundary 保持一致。
