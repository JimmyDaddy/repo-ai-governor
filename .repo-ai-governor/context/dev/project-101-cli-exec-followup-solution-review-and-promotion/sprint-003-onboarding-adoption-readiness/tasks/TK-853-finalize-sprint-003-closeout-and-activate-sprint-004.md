# TK-853 finalize sprint-003 closeout and activate sprint-004

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Sprint: `sprint-003-onboarding-adoption-readiness`

## 1. 任务目标

在 `TK-852` clean 后完成 sprint-003 closeout write-back，并将 `sprint-004-acp-host-facing-transport-formalization` 切换为新的 primary execution surface。

## 2. Depends On

1. `TK-852`
2. `.repo-ai-governor/context/current-context.md`

## 3. 预期产物

1. updated sprint-003 / sprint-004 plans
2. updated `current-context.md`
3. sprint-003 closeout handoff artifact

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/plan.md`
3. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/plan.md`
4. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/TK-852-promote-cli-exec-onboarding-and-adoption-readiness-solution-and-create-rollout-handoff.md`

## 6. 实施计划

1. 将 sprint-003 的 task ledger、plan 与 review surface 收口为 `completed`。
2. 将 `sprint-004` 切换为 primary active stream，并更新 project WBS 概览。
3. 保留 `project-104` 作为 planned rollout stream，不占用 active execution surface。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-code-review-status-sync.js`
2. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `planned`。
2. 2026-04-13：已完成 sprint-003 closeout write-back，将 sprint plan 与 project WBS 切换为 `completed`，并把 `sprint-004-acp-host-facing-transport-formalization` 激活为新的 primary execution surface。

## 10. 产出

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-853-sprint-003-closeout-and-sprint-004-activation-handoff.md`
