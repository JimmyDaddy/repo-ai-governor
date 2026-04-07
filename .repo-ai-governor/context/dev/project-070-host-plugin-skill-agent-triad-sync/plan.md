# project-070-host-plugin-skill-agent-triad-sync 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: docs truth sync
- Phase Mapping: Codex / Claude Code host ergonomics formal triad carry-slot sync
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
  - `.repo-ai-governor/context/dev/project-069-host-plugin-skill-agent-decomposition-refresh/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. 目标

1. 把 draft 中新增的 Codex / Claude Code plugin / skill / agent carry slot 正式同步到产品需求、简版需求、总技术方案与架构蓝图，避免下次盘点再次遗漏。
2. 明确 host-native ergonomics 资产的产品边界不是“只接入工具入口”，还包括 plugin / skill / subagent / hooks / MCP 等宿主原生分发与升级消费面。
3. 补齐 `project-069` 缺失的派生 ledger，确保本次文档同步窗口可通过治理检查。

## 2. Sprint 细化

## 2.1 sprint-001-formal-doc-truth-sync

- Status: active
- Sprint Goal: 把 host/plugin/skill/agent lifecycle carry slot 从 draft 提升到 triad 正式真值，并完成 docs-only closeout。
- Task Package: `TK-689`、`TK-690`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-689 | sprint-001 | sync codex claude host plugin skill agent carry slot into formal triad docs | docs/triad-sync | project-069 + current draft truth | completed |
| TK-690 | sprint-001 | finalize project-070 closeout and restore idle context | closeout/final-audit | TK-689 | completed |

## 4. 依赖产物策略

1. 以 triad 正式文档为长期真值，draft 只作为这次纠偏的输入与 traceback。
2. 不回退 `project-050` 已完成的 host-native distribution baseline；新增表述只覆盖后续 lifecycle / upgrade / adopter consumption carry slot。
3. 若命中 triad 同步，则必须同窗口同步完整版 PRD、简版 PRD、总技术方案与架构蓝图的日期与承载表述。

## 5. DoD（project-070）

1. triad + brief 中显式出现 Codex / Claude Code plugin / skill / subagent / hooks / MCP 等 host-native ergonomics 资产的生命周期与 adopter consumption 边界。
2. `project-069` 的 checklist / tasks.csv 派生面补齐，治理检查可通过。
3. project/sprint/task/context/history 全部收口到最终 completed / idle 真值，并明确本次为 docs-only 修订窗口。

## 6. 里程碑记录

1. 2026-04-08：创建 `project-070 / sprint-001`，用于把 host/plugin/skill/agent carry slot 从 draft 提升到正式 triad 真值层。
2. 2026-04-08：`TK-689` 已完成，正式 PRD、简版 PRD、总技术方案与架构蓝图已同步写入 host-native asset lifecycle / support-truth 承载位。
3. 2026-04-08：`TK-690 / DA-690` 已完成最终 closeout write-back，`project-070` 正式进入 `completed`，并在此里程碑回链 [project-070 completion audit summary](./project-070-host-plugin-skill-agent-triad-sync-completion-audit-summary.md)。
