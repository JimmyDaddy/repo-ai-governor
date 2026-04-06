# project-051-priority-roadmap-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-06
- Stage Mapping: technical solution promotion / follow-up decomposition
- Phase Mapping: roadmap formalization / registry-manifest synchronization / adopter rollout decomposition
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-next-priority-roadmap-based-on-current-surface-status.md`
  - `.repo-ai-governor/draft/repo-ai-governor-priority-roadmap-project-sprint-task-package-proposal.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 1. 目标

1. 将用户已明确同意的 priority roadmap draft 正式提升为 lifecycle-managed technical solution。
2. 将 formal landing 固定到 `runtime.governance-clients` 的 planning ADR，而不是新增并行 technical solution module。
3. 在同一变更窗口内，把 follow-up rollout 拆解为 `project-052` 到 `project-056` 的 planned stream skeleton，并形成统一 handoff artifact。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-followup-decomposition

- Status: completed
- Sprint Goal: 完成 adopter productization priority roadmap 的 promotion cutover，并把 follow-up 实施拆解为 `project-052 ~ project-056` planned stream。
- Task Package: `TK-586`、`TK-587`、`TK-588`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-586 | sprint-001 | activate project-051 and freeze priority roadmap promotion scope | governance/bootstrap | approved drafts + registries | completed |
| TK-587 | sprint-001 | promote priority roadmap into formal ADR and registries | docs/promotion-cutover | TK-586 | completed |
| TK-588 | sprint-001 | decompose follow-up rollout into planned project streams and handoff artifact | planning/followup-decomposition | TK-587 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion / decomposition stream，不宣称 CLI adopter truthfulness、real adapter invocation 或 VS Code rollout 已在代码面交付。
2. 正式化沿用既有 `runtime.governance-clients` module，不新增新的 runtime module。
3. `project-052 ~ project-056` 只登记为 planned follow-up stream，不在本项目窗口内抢跑实现。
4. `project-057` 与 `project-058` 仅作为 deferred follow-up 写入 handoff artifact，不进入 `current-context.md` 的 planned stream surface。

## 5. DoD（project-051）

1. `technical-solution.adopter-productization-priority-roadmap` 已进入 active lifecycle。
2. `runtime.governance-clients` 已新增 priority sequencing ADR，并同步到 module registry 与 normative loading manifest。
3. delivery handoff 已指向真实 planned follow-up stream `project-052-adopter-truthfulness-and-ga-closeout`。
4. `project-052 ~ project-056` 的 project / sprint / task skeleton 已落盘，并登记到 `current-context.md` 的 planned stream surface。
5. lifecycle / delivery / module-graph / manifest / docs-triad / ledger / review / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-06：用户明确批准两篇 roadmap draft，并要求“提升它们，然后按文档拆解任务”。
2. 2026-04-06：创建 `project-051`，将 priority roadmap formalize 为新 solution `technical-solution.adopter-productization-priority-roadmap`。
3. 2026-04-06：完成 `runtime.governance-clients` planning ADR、lifecycle / delivery / module registry / manifest 接线，以及 resolved promotion review。
4. 2026-04-06：完成 `project-052 ~ project-056` planned follow-up stream skeleton 与 `DA-588` handoff artifact。
5. 2026-04-06：项目完成态审计摘要已记录为 `project-051-priority-roadmap-promotion-and-decomposition-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-051-priority-roadmap-promotion-and-decomposition-completion-audit-summary.md](./project-051-priority-roadmap-promotion-and-decomposition-completion-audit-summary.md)
