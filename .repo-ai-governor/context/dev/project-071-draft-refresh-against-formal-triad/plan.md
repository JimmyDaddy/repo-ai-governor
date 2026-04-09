# project-071-draft-refresh-against-formal-triad 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: docs truth refresh
- Phase Mapping: post-triad-sync draft consolidation
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. 目标

1. 按新的正式需求与技术文档，重写当前优先级评估 draft 中关于 host-native distribution、adopter truth 与后续优先级排序的口径。
2. 把 decomposition draft 中 `project-067` 的定位、优先级、执行顺序和与其他项目的关系，升级到正式 triad 可回链的版本。
3. 输出一组新的可执行草案，便于后续直接激活 `project-062` 或 `project-067`。

## 2. Sprint 细化

## 2.1 sprint-001-priority-and-decomposition-refresh

- Status: active
- Sprint Goal: 用新的 formal triad 真值刷新两份当前 gap draft，并完成 docs-only 收口。
- Task Package: `TK-691`、`TK-692`、`TK-693`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-691 | sprint-001 | refresh current app priority assessment draft against formal triad truth | docs/analysis-refresh | project-070 triad sync | completed |
| TK-692 | sprint-001 | refresh surface gap decomposition draft against formal triad truth | docs/decomposition-refresh | TK-691 | completed |
| TK-693 | sprint-001 | finalize project-071 closeout and restore idle context | closeout/final-audit | TK-691、TK-692 | completed |

## 4. 依赖产物策略

1. 这次刷新以 formal triad + brief 为优先真值，support matrix / README / 已有 draft 作为现状与 adopter 边界证据。
2. 不把 `project-050` 的 host-native baseline 重新定义为“未实现”；只重写其后续 lifecycle / support-truth / adopter consumption 的优先级与承载关系。
3. 若新的 formal triad 让优先级排序发生变化，则 assessment draft 与 decomposition draft 必须同时改写，避免两份草案相互打架。

## 5. DoD（project-071）

1. priority assessment draft 与 decomposition draft 都显式对齐新的 PRD / brief / technical solution / architecture 口径。
2. `project-067` 不再只是“draft 中补出来的承载位”，而是具有正式 triad 回链的 follow-up stream。
3. project/sprint/task/context/history 全部收口到最终 completed / idle 真值，并明确本次为 docs-only 刷新窗口。

## 6. 里程碑记录

1. 2026-04-08：创建 `project-071 / sprint-001`，用于按 formal triad 真值重梳理两份当前 gap draft。
2. 2026-04-08：`TK-691` 已完成，priority assessment draft 已把 host-native lifecycle / support-truth 升级为正式 P1 follow-up。
3. 2026-04-08：`TK-692` 已完成，decomposition draft 已把 `project-067` 提升为带 triad 回链的 `P1` follow-up，并重排 adopter-facing distribution truth lane。
4. 2026-04-08：`TK-693 / DA-693` 已完成最终 closeout write-back，`project-071` 正式进入 `completed`，并在此里程碑回链 [project-071 completion audit summary](./project-071-draft-refresh-against-formal-triad-completion-audit-summary.md)。
