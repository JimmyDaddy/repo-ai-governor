# TK-1036 finalize project-120 closeout and restore idle context

- Status: planned
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-120-pr-23-copilot-review-remediation`
- Sprint: `sprint-001-unresolved-thread-fix-and-pr-recheck`

## 1. 任务目标

在 scoped review clean 收口后，完成 completion audit、completed history write-back 和 idle context 恢复。

## 2. Depends On

1. `TK-1035`
2. `CR-001`

## 3. 预期产物

1. `.repo-ai-governor/context/dev/project-120-pr-23-copilot-review-remediation/project-120-pr-23-copilot-review-remediation-completion-audit-summary.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-120-pr-23-copilot-review-remediation/plan.md`
3. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-120-pr-23-copilot-review-remediation/sprint-001-unresolved-thread-fix-and-pr-recheck/plan.md`
4. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-120-pr-23-copilot-review-remediation/sprint-001-unresolved-thread-fix-and-pr-recheck/tasks/tasks.csv`

## 5. Traceback References

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-120-pr-23-copilot-review-remediation/sprint-001-unresolved-thread-fix-and-pr-recheck/tasks/CR-001.md`

## 6. 实施计划

1. 汇总 verification、PR recheck 与 review 结论。
2. 将 project/sprint 更新为 completed。
3. 恢复 idle context 并写入 completed history。

## 7. Development Verification

1. node ./scripts/governance/check-task-ledger-sync.js
2. node ./scripts/governance/check-sprint-plan-status-sync.js
3. node ./scripts/governance/check-code-review-status-sync.js
4. node ./scripts/governance/check-worktree-review-target.js

## 8. Delivery Verification

1. node ./scripts/governance/check-task-ledger-sync.js
2. node ./scripts/governance/check-sprint-plan-status-sync.js
3. node ./scripts/governance/check-code-review-status-sync.js
4. node ./scripts/governance/check-worktree-review-target.js

## 9. 执行记录

1. 2026-04-21：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：project-120 completion audit
