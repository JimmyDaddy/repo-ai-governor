# project-089-local-user-config-and-secret-command-rollout 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: local user config and secret command rollout
- Phase Mapping: command foundation / runtime resolution and diagnostics / connect and surface discoverability
- Upstream:
  - `.repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/plan.md`
  - `.repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-786-local-user-config-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 1. 目标

1. 把 local-user-config / secret-backed command configuration 从 formal direction 推进到真实的 CLI、runtime、diagnostics 与 docs rollout 交付。
2. 先补 `user-config.yaml` canonical path、`config` / `secret` command foundation 与 macOS keychain baseline，再补 runtime resolution / doctor diagnostics，最后再补 `connect` defaults、session shell discoverability 与 docs evidence uplift。
3. 保持“user-local defaults 只能补默认、secret 只进 backend、canonical truth 仍回到 `enabled_tools[] / configured_remote_api / AgentDescriptor.selected_*`”这一长期边界。

## 2. Sprint 细化

## 2.1 sprint-001-user-config-command-and-secret-foundation

- Status: completed
- Sprint Goal: 冻结 canonical `user-config.yaml`、`config` / `secret` command surface、secure input boundary 与 macOS keychain baseline。
- Task Package: `TK-788`、`TK-789`、`TK-790`、`TK-791`

## 2.2 sprint-002-runtime-resolution-and-doctor-diagnostics

- Status: completed
- Sprint Goal: 打通 `credentialRef` runtime resolution、canonical onboarding/projection normalization 与 doctor secret diagnostics。
- Task Package: `TK-792`、`TK-793`、`TK-794`、`TK-795`

## 2.3 sprint-003-connect-default-consumption-and-surface-discoverability

- Status: completed
- Sprint Goal: 让 `connect` consume user defaults，补 session shell discoverability，并在 evidence gate 通过时升级 adopter docs / playbook。
- Task Package: `TK-796`、`TK-797`、`TK-798`、`TK-799`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-788 | sprint-001 | establish canonical user-config schema, migration, and config command storage semantics | config/foundation | promotion handoff | completed |
| TK-789 | sprint-001 | implement secret-backend abstraction and secure secret command mutation flow | secret/foundation | TK-788 | completed |
| TK-790 | sprint-001 | land macOS keychain baseline, shared i18n/error wiring, and unsafe-fallback warnings | platform/foundation | TK-789 | completed |
| TK-791 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | closeout/handoff | TK-788、TK-789、TK-790 | completed |
| TK-792 | sprint-002 | resolve credentialRef through secret backends and preserve env precedence | runtime/resolution | TK-790 | completed |
| TK-793 | sprint-002 | normalize user-config authoring into enabled-tools and projection canonical truth | onboarding/projection | TK-792 | completed |
| TK-794 | sprint-002 | add doctor secret-backend availability and missing-secret guidance across supported platforms | diagnostics/doctor | TK-793 | completed |
| TK-795 | sprint-002 | sprint-002 exit acceptance and sprint-003 activation handoff | closeout/handoff | TK-792、TK-793、TK-794 | completed |
| TK-796 | sprint-003 | consume user-config remote-api defaults in connect with analyze-first candidate materialization | connect/ux | TK-794 | completed |
| TK-797 | sprint-003 | add session shell config and secret discoverability plus command guidance | shell/ux | TK-796 | completed |
| TK-798 | sprint-003 | uplift adopter docs and playbook wording only when evidence gate passes | docs/evidence-gated uplift | TK-797 | completed |
| TK-799 | sprint-003 | finalize project-089 rollout closeout and delivery evidence handoff | closeout/delivery | TK-798 | completed |

## 4. 依赖产物策略

1. sprint-001 必须优先完成，因为后续 runtime resolution、doctor diagnostics 与 `connect` defaults 都依赖 canonical `user-config.yaml` 与 secure `secret` command boundary先稳定。
2. sprint-002 只在 sprint-001 稳定后启动，避免 runtime truth 建在漂移中的 authoring schema 上。
3. sprint-003 只在 runtime resolution 与 doctor diagnostics 都闭环后再执行 `connect` defaults、session shell discoverability 与 docs evidence uplift。
4. Windows / Linux backend parity 可以在 sprint-002 内完成最小正式支持，但不得提前抢跑 adopter-facing wording uplift。

## 5. DoD（project-089）

1. `user-config.yaml` 已成为 canonical user-local defaults path，并稳定兼容 `cli-preferences.yaml` 迁移。
2. `secret` command family 能以 secure input 模式写入 default backend，并保持 unsafe fallback warning truthfulness。
3. runtime / doctor / connect / session shell 都能消费同一条 canonical truth，而不是平行 command-surface state。
4. 若 evidence gate 通过，`docs/local-adoption-playbook*` 与相关 adopter docs 已完成受控 uplift；否则保留保守 wording 与 gap register。

## 6. 里程碑记录

1. 2026-04-11：基于 `technical-solution.local-user-config-and-secret-backed-command-configuration` promotion cutover 创建 `project-089`，作为新的 planned follow-up stream。
2. 2026-04-11：已将 `sprint-001 ~ sprint-003` 与 `TK-788 ~ TK-799` 全量拆解写入 project / sprint / task surface，待后续窗口按顺序激活。
3. 2026-04-11：已激活 `sprint-001-user-config-command-and-secret-foundation`，开始落地 canonical `user-config.yaml`、`config` / `secret` command foundation 与 secure backend baseline。
4. 2026-04-12：`sprint-001` 已在 `CR-004` clean 后完成 closeout，`TK-791 / DA-791` 已将 primary execution surface 切换到 `sprint-002-runtime-resolution-and-doctor-diagnostics`，并激活 `TK-792`。
5. 2026-04-12：`sprint-002` 已在 `CR-003` clean 后完成 closeout，`TK-795 / DA-795` 已将 primary execution surface 切换到 `sprint-003-connect-default-consumption-and-surface-discoverability`，并激活 `TK-796`。
6. 2026-04-12：`TK-796 ~ TK-798` 已完成 `connect` 默认值消费、session shell discoverability 与 adopter docs evidence-gated uplift，并通过 `pnpm run build` + sprint-003 focused verification suite；下一边界进入 sprint-003 delegated CR loop。
7. 2026-04-12：`CR-001` 与 `CR-002` 已先后 clean `resolved`；`TK-799 / DA-799` 已完成 final closeout write-back，`project-089` 正式进入 `completed`，并在此里程碑回链 [project-089 completion audit summary](./project-089-local-user-config-and-secret-command-rollout-completion-audit-summary.md)。

## 7. 里程碑记录入口

1. [project-089-local-user-config-and-secret-command-rollout-completion-audit-summary.md](./project-089-local-user-config-and-secret-command-rollout-completion-audit-summary.md)
