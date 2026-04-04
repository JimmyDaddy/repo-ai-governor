# project-047-governance-surface-clients-solution-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-05
- Stage Mapping: technical solution promotion / follow-up decomposition
- Phase Mapping: formal module landing / registry-manifest synchronization / rollout project decomposition
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-desktop-governance-command-center-detailed-solution.md`
  - `.repo-ai-governor/draft/repo-ai-governor-desktop-complete-product-surface-benchmark-and-decision.md`
  - `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 1. 目标

1. 将用户已明确同意的 `Desktop governance command center` 细化方案正式提升为 lifecycle-managed technical solution。
2. 为该方案建立新的 formal module landing zone，并同步 lifecycle / delivery / module registry / manifest。
3. 在同一变更窗口内，把 formalized solution 拆成可直接激活的 follow-up implementation stream，而不是停留在方向结论层。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-followup-decomposition

- Status: completed
- Sprint Goal: 完成 `technical-solution.governance-surface-clients` 的 promotion cutover，并把后续实现拆解为 `project-048` planned follow-up stream。
- Task Package: `TK-556`、`TK-557`、`TK-558`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-556 | sprint-001 | activate project-047 and freeze governance surface clients promotion scope | governance/bootstrap | approved draft + registries | completed |
| TK-557 | sprint-001 | promote governance surface clients solution into formal module docs and registries | docs/promotion-cutover | TK-556 | completed |
| TK-558 | sprint-001 | decompose governance surface clients rollout into planned project-048 and activation handoff | planning/followup-decomposition | TK-557 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion / decomposition stream，不宣称 desktop 或 VS Code capability 已在代码面完成。
2. 正式化采用新的 `runtime.governance-clients` module，不把 desktop / VS Code surface 强行塞回 `runtime.cli-interactive-shell` 或 `runtime.orchestration`。
3. `project-048` 只登记为 planned follow-up stream，不在本项目窗口内冒进激活执行。

## 5. DoD（project-047）

1. `technical-solution.governance-surface-clients` 已进入 active lifecycle。
2. `runtime.governance-clients` 的 module overview / contract / ADR 已落地并接入 module registry 与 manifest。
3. delivery handoff 已指向真实 follow-up stream `project-048-governance-surface-clients-rollout`。
4. review、task ledger、current-context、completed history 与 artifact registry 已同步。
5. lifecycle / delivery / module-graph / manifest / docs-triad / ledger / review / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-05：用户明确表示“我同意这个技术方案……帮我提升它，提升完成后进行任务拆解”。
2. 2026-04-05：创建 `project-047`，将 approved draft formalize 为新 solution `technical-solution.governance-surface-clients` 与新 module `runtime.governance-clients`。
3. 2026-04-05：完成 `project-048` planned follow-up stream 拆解，并将其登记到 `current-context.md` 的 `Planned Follow-Up Streams`。
4. 2026-04-05：项目完成态审计摘要已记录为 `project-047-governance-surface-clients-solution-promotion-and-decomposition-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-047-governance-surface-clients-solution-promotion-and-decomposition-completion-audit-summary.md](./project-047-governance-surface-clients-solution-promotion-and-decomposition-completion-audit-summary.md)
