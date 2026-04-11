# project-088-local-user-config-and-secret-command-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: technical solution promotion / follow-up decomposition
- Phase Mapping: runtime.agent-projection + runtime.governance-clients formal cutover / lifecycle-delivery synchronization / planned rollout decomposition
- Upstream:
  - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_local-user-config-and-secret-backed-command-configuration.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 1. 目标

1. 将已批准的 `technical-solution.local-user-config-and-secret-backed-command-configuration` 正式提升为 active lifecycle-managed solution。
2. 在 `runtime.agent-projection` producer truth 与 `runtime.governance-clients` consumer truth 中收敛 user-config defaults、secret-backed credential resolution 与 command-surface authoring boundary。
3. 在同一变更窗口内把实现 follow-up 拆解为真实的 planned rollout stream `project-089-local-user-config-and-secret-command-rollout`。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-followup-decomposition

- Status: completed
- Sprint Goal: 完成 local-user-config solution 的 formal promotion cutover，并将后续实现拆解为 `project-089` planned rollout stream。
- Task Package: `TK-784`、`TK-785`、`TK-786`、`TK-787`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-784 | sprint-001 | activate project-088 and freeze local-user-config promotion scope | governance/bootstrap | approved review + registries | completed |
| TK-785 | sprint-001 | promote local-user-config solution into formal module docs and registries | docs/promotion-cutover | TK-784 | completed |
| TK-786 | sprint-001 | decompose local-user-config rollout into planned project-089 and activation handoff | planning/followup-decomposition | TK-785 | completed |
| TK-787 | sprint-001 | finalize project-088 closeout and register planned rollout ownership | closeout/final-audit | TK-786 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion / decomposition stream，不宣称 CLI 命令、secret backend 或 public docs wording 已在同窗全部交付。
2. formal landing 只更新既有 `runtime.agent-projection` 与 `runtime.governance-clients` module docs；本轮不新建平行 module，也不把 `.repo-ai-governor/draft/**` 变成 formal truth。
3. delivery mode 固定为 `followup_required`；promotion 完成后必须落地真实的 planned rollout project，而不是只在 active solution entry 中留下抽象 TODO。
4. `user-config.yaml`、secret backend 与 `connect / doctor / verify` 的 canonical truth 边界在本轮 formalize，但实际实现与 cross-platform rollout 由 `project-089` 承接。

## 5. DoD（project-088）

1. `technical-solution.local-user-config-and-secret-backed-command-configuration` 已进入 active lifecycle，并写入 `final_paths`。
2. `runtime.agent-projection` 与 `runtime.governance-clients` formal docs 已同步 user-config defaults、secret-backed credential resolution 与 command-surface authoring boundary。
3. delivery registry 已指向真实 planned follow-up stream `project-089-local-user-config-and-secret-command-rollout`。
4. review、task ledger、current-context、completed history 与 artifact registry 已同步。
5. lifecycle / delivery / module-graph / manifest / docs-triad / ledger / review / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-11：用户明确要求在 approved review 之后继续执行 `technical-solution-promotion`，并立刻进行任务拆解。
2. 2026-04-11：创建 `project-088 / sprint-001`，正式承接 local-user-config solution promotion 与 follow-up decomposition。
3. 2026-04-11：完成 `TK-784 ~ TK-787`，formal docs、lifecycle / delivery / manifest 与 planned `project-089` 已同步落地。
4. 2026-04-11：项目完成态审计摘要已记录为 `project-088-local-user-config-and-secret-command-promotion-and-decomposition-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-088-local-user-config-and-secret-command-promotion-and-decomposition-completion-audit-summary.md](./project-088-local-user-config-and-secret-command-promotion-and-decomposition-completion-audit-summary.md)
