# project-061-current-surface-gap-task-decomposition-draft 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: roadmap decomposition refresh
- Phase Mapping: current surface gap guide -> project/sprint/task packages
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
  - `docs/support-matrix.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`

## 1. 目标

1. 把当前端面差距分析从“状态说明”进一步推进成可执行的 project / sprint / task package 草案。
2. 基于更新后的 2026-04-08 真值修正旧分析稿中的部分过时判断，避免直接复刻旧 gap。
3. 形成一份可以直接作为后续 active primary stream 候选输入的拆解文档。

## 2. Sprint 细化

## 2.1 sprint-001-project-sprint-task-package-decomposition

- Status: completed
- Sprint Goal: 基于当前端面缺口分析，输出一份新的 project / sprint / task package 拆解 draft。
- Task Package: `TK-659`、`TK-660`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-659 | sprint-001 | decompose current surface gap guide into project sprint and task packages | analysis/decomposition | current guide + latest priority truth | completed |
| TK-660 | sprint-001 | finalize project-061 closeout and clear the active primary stream | closeout/final-audit | TK-659 | completed |

## 4. 依赖产物策略

1. 以 `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md` 作为结构性输入，但不机械继承其所有 gap 结论。
2. 以 `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md` 和 `docs/support-matrix.md` 作为当前优先级与正式支持边界修正面。
3. 拆解结果优先服务“下一条该执行什么”，而不是继续扩写纯状态说明文档。

## 5. DoD（project-061）

1. `.repo-ai-governor/draft/` 下新增一份当前端面缺口的 project / sprint / task 拆解文档。
2. 文档需要给出：
   - 下一条建议激活的 primary stream
   - planned follow-up streams
   - 对应的 sprint 切分与 `TK-xxx` 建议任务编号
3. project/sprint/task/context/history 已收口为最终 completed / idle 真值，且明确这是 docs-only 拆解窗口。

## 6. 里程碑记录

1. 2026-04-08：创建 `project-061 / sprint-001`，用于把当前端面缺口分析进一步拆成 project/sprint/task package。
2. 2026-04-08：`TK-659` 已完成，产出新的 `project-062+` future stream 拆解草案，并把 CLI continuity / probe truthfulness 设为建议的下一条 primary stream。
3. 2026-04-08：`TK-660 / DA-660` 已完成最终 closeout write-back，`project-061` 正式进入 `completed`，并在此里程碑回链 [project-061 completion audit summary](./project-061-current-surface-gap-task-decomposition-draft-completion-audit-summary.md)。
