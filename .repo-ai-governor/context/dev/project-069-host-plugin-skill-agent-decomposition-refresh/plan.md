# project-069-host-plugin-skill-agent-decomposition-refresh 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: decomposition truth refresh
- Phase Mapping: Codex / Claude Code host ergonomics carry-slot correction
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
  - `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/project-050-governance-surface-clients-host-distribution-rollout-completion-audit-summary.md`

## 1. 目标

1. 修正当前拆解稿里“Codex / Claude Code plugin / skill / agent 方案没有承载位”的遗漏。
2. 保持 `project-050` 的 host-native distribution 已完成结论不被回退，同时为后续 lifecycle / adopter consumption follow-up 留出明确 future stream。
3. 让后续如果要推进 Codex / Claude Code host ergonomics，不必硬塞进 `github-com-agent` 或其他无关项目。

## 2. Sprint 细化

## 2.1 sprint-001-host-ergonomics-carry-slot-refresh

- Status: completed
- Sprint Goal: 为 Codex / Claude Code plugin / skill / agent lifecycle 和 adopter consumption 补一个清晰的 future project 承载位。
- Task Package: `TK-687`、`TK-688`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-687 | sprint-001 | refresh decomposition draft with codex claude plugin skill and agent carry slot | docs/decomposition | current decomposition + project-050 traceback | completed |
| TK-688 | sprint-001 | finalize project-069 closeout and clear the active primary stream | closeout/final-audit | TK-687 | completed |

## 4. 依赖产物策略

1. 不否认 `project-050` 已完成的 host-native distribution baseline。
2. 新增的承载位只覆盖后续 lifecycle / upgrade / support-truth / adopter consumption follow-up，不把已完成基线重新包装成“未实现”。
3. `github-com-agent` reserved target 继续保留在独立 follow-up，不与 Codex / Claude Code host ergonomics 混写。

## 5. DoD（project-069）

1. 当前拆解稿中新增一条专门承载 Codex / Claude Code plugin / skill / agent follow-up 的 future stream。
2. `project-050` 已完成边界、host ergonomics follow-up、`github-com-agent` reserved target follow-up 三者区分清楚。
3. project/sprint/context/history/task ledger 均恢复为最终 completed / idle 真值。

## 6. 里程碑记录

1. 2026-04-08：创建 `project-069 / sprint-001`，用于修正拆解稿中 host/plugin/skill/agent 方案缺少承载位的问题。
2. 2026-04-08：`TK-687` 已完成，新的拆解稿已新增 `project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption`。
3. 2026-04-08：`TK-688 / DA-688` 已完成最终 closeout write-back，`project-069` 正式进入 `completed`，并在此里程碑回链 [project-069 completion audit summary](./project-069-host-plugin-skill-agent-decomposition-refresh-completion-audit-summary.md)。
