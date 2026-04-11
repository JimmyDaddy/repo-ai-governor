# DA-786 local-user-config promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-11
- Owner: AI-Agent
- Task: `TK-786`
- Project: `project-088-local-user-config-and-secret-command-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. Summary

1. `technical-solution.local-user-config-and-secret-backed-command-configuration` 已进入 `active` lifecycle-managed solution。
2. formal landing 已固定为 `runtime.agent-projection` producer truth + `runtime.governance-clients` consumer truth。
3. implementation follow-up 已拆解为 `project-089-local-user-config-and-secret-command-rollout`。
4. 当前 formal scope 只锁定 user-config defaults、secret-backed credential resolution 与 command-surface authoring boundary；真实 CLI / runtime rollout 仍待 follow-up 实现。

## 2. Immediate Activation Recommendation

1. 下一条真正建议激活的 implementation stream 固定为 `project-089 / sprint-001-user-config-command-and-secret-foundation`。
2. 第一批必须优先冻结：
   - canonical `user-config.yaml` path 与 `cli-preferences.yaml` migration rule
   - `config` / `secret` command family 的 secure input / precedence boundary
   - macOS keychain baseline、shared error/i18n wiring 与 unsafe fallback warning
3. 在 sprint-001 clean 收口前，不建议抢跑 `connect` 默认值消费、session shell discoverability 或 adopter-facing docs wording uplift。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-089-local-user-config-and-secret-command-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-089-local-user-config-and-secret-command-rollout/sprint-001-user-config-command-and-secret-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-089-local-user-config-and-secret-command-rollout/sprint-002-runtime-resolution-and-doctor-diagnostics/plan.md`
4. `.repo-ai-governor/context/dev/project-089-local-user-config-and-secret-command-rollout/sprint-003-connect-default-consumption-and-surface-discoverability/plan.md`
