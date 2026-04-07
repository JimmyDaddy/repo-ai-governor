# TK-673 freeze desktop secondary-surface productization decision and packaging boundary

- Status: in_progress
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-065-desktop-secondary-surface-productization-decision`
- Sprint: `sprint-001-secondary-surface-decision-and-packaging-boundary`

## 1. 任务目标

冻结 desktop secondary-surface 的产品化决策与 packaging boundary，避免 foundation-only 与 productized 口径继续混写。

## 2. Depends On

1. `project-064` recommended
2. `DA-696`

## 3. 预期产物

1. desktop decision contract
2. packaging boundary
3. implementation input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
3. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/project-044-desktop-governance-console-mvp-foundation-completion-audit-summary.md`

## 6. 实施计划

1. 明确 desktop 是继续 foundation-only 还是进入 productization lane。
2. 冻结 packaging/support boundary。
3. 将 seam 或 guardrail 实施输入交给 `TK-674`。

## 7. Development Verification

1. desktop surface boundary review
2. packaging/support contract check

## 8. Delivery Verification

1. desktop packaging decision evidence
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：`project-064` final closeout 已完成，当前任务切换为 `in_progress`，开始冻结 desktop secondary-surface decision、packaging boundary 与 public support-truth contract。

## 10. 产出

1. 待执行：desktop decision contract
2. 待执行：packaging boundary
