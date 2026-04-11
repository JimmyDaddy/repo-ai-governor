# sprint-001-user-config-command-and-secret-foundation 计划

- Status: completed
- Date: 2026-04-11
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint Goal: 冻结 canonical `user-config.yaml`、`config` / `secret` command surface、secure input boundary 与 macOS keychain baseline。

## 1. Task Package

1. `TK-788` establish canonical user-config schema, migration, and config command storage semantics
2. `TK-789` implement secret-backend abstraction and secure secret command mutation flow
3. `TK-790` land macOS keychain baseline, shared i18n/error wiring, and unsafe-fallback warnings
4. `TK-791` sprint-001 exit acceptance and sprint-002 activation handoff

## 2. Exit Criteria

1. `~/.repo-ai-governor/user-config.yaml` 已成为 canonical path，并具备 `cli-preferences.yaml` 迁移规则。
2. `config` / `secret` command family 的 secure input、precedence 与 unsafe fallback warning 边界已稳定。
3. macOS keychain baseline、shared error code 与 i18n 文案基线已具备。

## 3. Milestones

1. 2026-04-11：作为 `project-089` 的第一阶段 execution surface 创建，当前保持 `planned`。
2. 2026-04-11：已切换为 active sprint，开始执行 `TK-788` 的 canonical `user-config.yaml` / migration foundation。
3. 2026-04-12：`CR-001 ~ CR-004` 已全部 `resolved`，`TK-791 / DA-791` 已完成 sprint-001 closeout 与 sprint-002 activation handoff。
