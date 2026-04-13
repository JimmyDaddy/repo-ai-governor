# project-095-session-shell-theme-persistence-feedback-clarity 计划

- Status: completed
- Date: 2026-04-13
- Stage Mapping: session shell theme persistence feedback clarification
- Phase Mapping: set-ui-theme success feedback refinement + regression coverage + closeout
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. 目标

1. 让 `set-ui-theme` / `workspace set-ui-theme` 成功反馈更直白地点名主题实际写入的是 workspace config 还是 global user-config。
2. 保持现有 theme persistence 语义不变，只增强用户可感知的成功提示、summary 和帮助文案。
3. 在同一小窗口内完成测试、build 与 closeout，同步治理面。

## 2. Sprint 细化

## 2.1 sprint-001-persistence-scope-feedback

- Status: completed
- Sprint Goal: 澄清 set-ui-theme 的持久化目标反馈，并完成回归验证、build 与 closeout。
- Task Package: `TK-815`、`TK-816`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-815 | sprint-001 | clarify theme persistence target feedback for set-ui-theme | cli/i18n/tests | project-084、project-094 theme baseline | completed |
| TK-816 | sprint-001 | finalize project-095 closeout after persistence feedback clarification | closeout/final-audit | TK-815 | completed |

## 4. 依赖产物策略

1. 本项目不修改 theme persistence 层级，只改成功反馈、summary、help 与对应断言。
2. 新增反馈必须明确区分 `workspace config`、`global user-config` 与“workspace + repo-local selector config 双写”这几种路径。
3. closeout 必须恢复 idle context，并把 stream 迁入 completed history。

## 5. DoD（project-095）

1. `set-ui-theme` 成功反馈可以让用户一眼看出写盘目标。
2. 相关测试与 `pnpm run build` 通过。
3. task ledger / checklist / tasks.csv / current-context 同步完成。

## 6. 里程碑记录

1. 2026-04-13：基于用户对“主题切换是不是没有持久化”的疑问创建 `project-095`。
2. 2026-04-13：`TK-815` 已完成成功反馈澄清，明确区分 `workspace config`、`global user-config` 与双写场景。
3. 2026-04-13：`TK-816` 已完成 closeout，并在此里程碑回链 [project-095 completion audit summary](./project-095-session-shell-theme-persistence-feedback-clarity-completion-audit-summary.md)。
