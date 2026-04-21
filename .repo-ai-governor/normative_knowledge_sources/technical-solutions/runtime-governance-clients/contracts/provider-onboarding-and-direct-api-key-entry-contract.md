# Provider Onboarding And Direct API Key Entry Contract

- Status: active
- Date: 2026-04-20
- Contract ID: `contract.runtime.governance-provider-onboarding.v1`
- Producer Module: `runtime.governance-clients`

## 1. 目标

定义宿主原生 provider onboarding 的最小 contract，使 VS Code 插件与后续 host surface 可以直接采集 API key 并完成 secret-backed `credentialRef` authoring，同时保持 `connect / doctor / verify` 继续作为 analyze-first / read-only onboarding truth。

## 2. Minimum Capability Fields

1. `surface_id`
2. `entrypoint_kind`
3. `mutation_mode`
4. `tool`
5. `provider`
6. `secret_capture_mode`
7. `secret_owner`
8. `credential_ref_strategy`
9. `config_targets[]`
10. `readiness_projection_source`
11. `receipt_fields[]`

## 3. Allowed Values

1. `surface_id`
   - `vscode_provider_onboarding`
2. `entrypoint_kind`
   - `overview_cta`
   - `command_palette`
   - `chat_command`
   - `quick_pick_form`
3. `mutation_mode`
   - `explicit_provider_onboarding_command`
4. `secret_capture_mode`
   - `host_secure_prompt`
5. `secret_owner`
   - `governor_managed_secret_backend`
6. `credential_ref_strategy`
   - `provider_default_api_key`
7. `readiness_projection_source`
   - `provider_onboarding_snapshot`
   - `agent_onboarding_summary`

## 4. Required Constraints

1. 人类用户的 direct API key entry 必须通过显式 `provider_onboarding` mutation seam 或等价 host-facing command 完成；`connect / doctor / verify` 继续保持 analyze-first / read-only onboarding boundary。
2. raw API key 只允许经由 host-local secure prompt 进入 mutation request；不得写入 `settings.json`、`governor.yaml`、`user-config.yaml`、chat transcript、command preview、日志、diagnostics 或其他 presenter-safe copy surface。
3. canonical secret owner 固定为 Governor managed secret backend；VS Code `SecretStorage` 或其他 extension-local storage 只允许作为补充平台能力，不得被升格为正式持久化真值。
4. host-facing onboarding 只允许持久化非敏感 provider config 与 selector truth；默认允许的 config target 仅限：
   - `tools.<tool>.transport`
   - `tools.<tool>.remoteApi.provider`
   - `tools.<tool>.remoteApi.vendorBinding`
   - `tools.<tool>.remoteApi.model`
   - `tools.<tool>.remoteApi.endpoint`
   - `tools.<tool>.remoteApi.credentialRef`
5. `runtime.agent-projection` 继续拥有 `transport / provider / vendor_binding` 的 canonical normalization 与 `verification_status / next_action(s)` taxonomy；host surface 不得重新发明第二套 readiness truth。
6. 当 `provider + transport + user input` 不能唯一推出 `vendorBinding`、selector 或 canonical config 组合时，host surface 必须 fail-closed 并回到 runtime-owned guidance；不得在插件内用临时 heuristics 静默补全。
7. `provider_default_api_key` 的默认 selector 固定为 `secret://<provider>/api-key`；若后续 runtime 需要更细粒度 selector，必须由 canonical normalization owner 显式变更，而不是由 host UI 自行偏离。
8. apply receipt 至少必须回传：
   - `tool`
   - `provider`
   - `credentialRef`
   - `secretBackend`
   - `warnings[]`
   - `nextAction`
9. host-facing readiness surface 可以显示 `Connect Provider`、`Update API Key`、`Reconnect Provider` 这类 CTA，但它们只能是 `provider_onboarding_snapshot` 或 canonical `next_action(s)` 的 host-level 映射，不得反向写回 runtime taxonomy。
10. CLI / CI / headless surface 继续允许保留 `credentialEnvVar` 与其他非 GUI onboarding path；本 contract 不允许借机移除现有兼容入口。
11. host surface 可以为了 UX 临时分步采集 provider、model、endpoint 与 API key，但 durable commit 必须收敛为同一条 service-owned mutation / receipt，而不是长期暴露多条原子 config/secret authoring truth。

## 5. Consumers

1. `apps/vscode-extension`
2. future `apps/desktop`
3. `docs/help/playbook/discoverability`
4. `runtime.agent-projection`

## 6. Compatibility

1. `v1` 允许 service implementation 在内部复用既有 `config` / `secret` mutation seam，只要对宿主暴露的是统一的 provider-onboarding facade，而不是长期泄漏 raw config key authoring。
2. `v1` 允许 host surface 使用 provider-specific label、placeholder 与 CTA 文案，只要 canonical persisted truth 仍保持 `transport/provider/vendorBinding/model/endpoint/credentialRef` 这条统一 shape。
3. `v1` 不要求在本轮 formalization 中同步改口 README、support matrix 或 adoption playbook；公开支持口径仍受 rollout evidence gate 约束。
