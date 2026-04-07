# project-072-current-surface-priority-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: technical solution promotion / follow-up decomposition
- Phase Mapping: current-surface validation formalization / registry-manifest synchronization / planned stream decomposition
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 1. 目标

1. 将用户已明确同意的 current-surface priority assessment 与 decomposition draft 正式提升为 lifecycle-managed technical solution refinement。
2. 把 formal landing 固定到 `runtime.governance-clients` 的既有 planning ADR 体系，而不是新建并行 module。
3. 在同一变更窗口内，落盘 `project-062 ~ project-068` 的 planned project / sprint / task skeleton，并形成统一 handoff artifact。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-formal-followup-decomposition

- Status: completed
- Sprint Goal: 完成 current-surface priority formal ADR promotion cutover，并把 follow-up 实施拆解为 `project-062 ~ project-068` planned stream。
- Task Package: `TK-694`、`TK-695`、`TK-696`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-694 | sprint-001 | activate project-072 and freeze current-surface priority promotion scope | governance/bootstrap | approved drafts + registries | completed |
| TK-695 | sprint-001 | promote current-surface priority assessment and decomposition into formal ADRs and registries | docs/promotion-cutover | TK-694 | completed |
| TK-696 | sprint-001 | materialize project-062 through project-068 planned streams and restore idle context | planning/followup-decomposition | TK-695 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only promotion / decomposition stream，不宣称 `project-062 ~ project-068` 已在代码面交付。
2. 正式化沿用既有 `runtime.governance-clients` module，并把新的 current-surface baseline/decomposition 作为附加 ADR 写入同一模块。
3. `project-062 ~ project-068` 只登记为 planned follow-up streams，不在本项目窗口内直接切换 active primary stream。
4. `project-072` 完成后，`current-context.md` 应恢复为 `idle`，但 planned follow-up streams 必须保持可见。

## 5. DoD（project-072）

1. `technical-solution.adopter-productization-priority-roadmap` 已更新为 `v2`，并具备新的 review evidence、final paths 与 planned delivery ownership。
2. `runtime.governance-clients` 已同步更新 priority sequencing ADR，并新增 current-surface baseline/decomposition ADR。
3. delivery handoff 已指向真实 planned follow-up stream `project-062-cli-continuity-and-adapter-truthfulness-hardening`。
4. `project-062 ~ project-068` 的 project / sprint / task skeleton 已落盘，并登记到 `current-context.md` 的 planned stream surface。
5. lifecycle / delivery / module-graph / manifest / task-ledger / sprint-status / review / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-08：用户明确批准两篇 current-surface priority / decomposition draft，并要求“提升它们，然后拆解出对应的执行任务”。
2. 2026-04-08：创建 `project-072`，将 current-surface priority refinement formalize 为 `technical-solution.adopter-productization-priority-roadmap` 的 `v2`。
3. 2026-04-08：完成 `runtime.governance-clients` formal ADR、lifecycle / delivery / module registry / manifest 接线，以及 resolved promotion review。
4. 2026-04-08：完成 `project-062 ~ project-068` planned follow-up stream skeleton 与 `DA-696` handoff artifact。
5. 2026-04-08：项目完成态审计摘要已记录为 `project-072-current-surface-priority-promotion-and-decomposition-completion-audit-summary.md`。

## 7. 里程碑记录入口

1. [project-072-current-surface-priority-promotion-and-decomposition-completion-audit-summary.md](./project-072-current-surface-priority-promotion-and-decomposition-completion-audit-summary.md)
