# project-060-current-app-feature-gap-priority-draft 计划

- Status: completed
- Date: 2026-04-08
- Stage Mapping: product surface truth refresh
- Phase Mapping: current app feature classification and priority draft handoff
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
  - `docs/support-matrix.md`

## 1. 目标

1. 基于当前仓库实际代码面、README、support matrix 与已有 draft，重新判断哪些能力已经实现，哪些仍只是 baseline / MVP / foundation / reserved 占位。
2. 避免沿用已过时的 gap 结论，把已经完成的能力误报成“未实现”，同时把真正仍需继续实现或产品化的缺口明确分层。
3. 输出一份按优先级排序的中文 draft，供后续 project/sprint 拆解使用。

## 2. Sprint 细化

## 2.1 sprint-001-current-surface-gap-classification-and-priority-draft

- Status: completed
- Sprint Goal: 形成一份对当前应用真实实现度、baseline/占位面和后续优先级都足够 truthful 的 draft 分析。
- Task Package: `TK-657`、`TK-658`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-657 | sprint-001 | analyze current app feature gaps baseline surfaces and priority draft | analysis/draft | current support + PRD truth surfaces | completed |
| TK-658 | sprint-001 | finalize project-060 closeout and clear the active primary stream | closeout/final-audit | TK-657 | completed |

## 4. 依赖产物策略

1. 以 `docs/support-matrix.md`、根级 `README.md`、`apps/*/README.md`、`packages/standards/README.md`、`packages/adapters/local-model/README.md` 为当前端面 truth 优先输入。
2. 旧 draft 只作为 traceback 与对比输入，不直接继承其结论；凡是已被当前代码面或 support matrix 推翻的旧缺口，必须显式剔除。
3. 优先级排序以“对当前主入口 CLI 的用户影响”“是否属于正式支持边界”“是否仍只是占位或保守支持口径”为主，而不是按实现难度排序。

## 5. DoD（project-060）

1. `.repo-ai-governor/draft/` 下产出一份新的当前应用功能差距与优先级分析文档。
2. 文档能清楚区分：
   - 已经正式实现/支持的能力
   - baseline / MVP / foundation / fallback-only / reserved 占位面
   - 真正仍需继续实现或产品化的缺口
3. project/sprint/task/context/history 全部同步到最终完成态，且明确说明这是 docs-only 分析窗口。

## 6. 里程碑记录

1. 2026-04-08：创建 `project-060 / sprint-001`，用于对当前应用功能实现度、baseline 占位面与优先级做一次重新归档。
2. 2026-04-08：`TK-657` 已完成，产出新的当前应用功能差距与优先级 draft，并明确若干旧 draft 结论已过时。
3. 2026-04-08：`TK-658 / DA-658` 已完成最终 closeout write-back，`project-060` 正式进入 `completed`，并在此里程碑回链 [project-060 completion audit summary](./project-060-current-app-feature-gap-priority-draft-completion-audit-summary.md)。
