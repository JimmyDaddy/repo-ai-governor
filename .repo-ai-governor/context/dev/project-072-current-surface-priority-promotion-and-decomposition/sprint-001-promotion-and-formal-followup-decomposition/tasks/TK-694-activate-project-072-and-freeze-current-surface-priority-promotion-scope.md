# TK-694 activate project-072 and freeze current-surface priority promotion scope

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-072-current-surface-priority-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-formal-followup-decomposition`

## 1. 任务目标

激活 `project-072` promotion stream，并冻结 solution `v2` scope、target module、delivery mode 与 gate 范围。

## 2. Depends On

1. 用户已明确同意两篇 current-surface priority / decomposition draft
2. `technical-solution.adopter-productization-priority-roadmap` 现有 lifecycle / delivery 记录

## 3. 预期产物

1. `project-072` 目录骨架
2. promotion scope freeze
3. delivery mode 与 review/gate 范围冻结

## 4. Required Inputs

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-071-draft-refresh-against-formal-triad/plan.md`
2. `.repo-ai-governor/context/dev/project-051-priority-roadmap-promotion-and-decomposition/plan.md`

## 6. 实施计划

1. 确认 solution 仍落到 `runtime.governance-clients`，不新开并行 module。
2. 冻结本轮需要同步的 lifecycle / delivery / module registry / manifest / current-context 面。
3. 为 resolved review、handoff artifact 与 planned follow-up stream 创建承载位。

## 7. Development Verification

1. promotion scope 与 existing module boundary consistency check
2. registry target-path existence check

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已完成 `project-072` 目录骨架、solution/module/delivery scope 与 gate 范围冻结。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/plan.md`
