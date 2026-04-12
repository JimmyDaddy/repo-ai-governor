# TK-810 finalize project-092 closeout and clear the active primary stream

- Status: planned
- Date: 2026-04-12
- Owner: AI-Agent
- Priority: P0
- Project: `project-092-session-shell-secure-secret-input-rollout`
- Sprint: `sprint-001-secure-local-capture-and-redacted-secret-mutation`

## 1. 任务目标

在 latest project-final `CR` clean 后完成 `project-092` 的最终 closeout write-back，把 project / sprint / context / history / delivery 一次性同步到完成态，并清空当前 worktree 的 active primary stream。

## 2. Depends On

1. `TK-809`
2. latest project-final `CR`

## 3. 预期产物

1. final closeout handoff
2. project completion audit summary
3. completed truth write-back across project / sprint / context / history / delivery

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/plan.md`
5. latest project-final resolved review artifact

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/sprint-001-secure-local-capture-and-redacted-secret-mutation/tasks/TK-809-sprint-001-exit-acceptance-and-project-completion-assessment.md`
2. `.repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/sprint-001-secure-local-capture-and-redacted-secret-mutation/tasks/DA-809-sprint-001-closeout-and-project-final-review-activation-handoff.md`

## 6. 实施计划

1. 在 latest project-final `CR` `resolved` 后补齐 final closeout handoff 与 completion audit summary。
2. 把 project / sprint plan 恢复到最终 `completed` 真值，并同步 `current-context.md` 与 `completed-streams-history.md`。
3. 更新 delivery registry completed truth，并确认当前 worktree 不再保留 active primary stream。

## 7. Development Verification

1. 校对 `project-092` 当前所有 `TK/CR` 已进入终态。
2. 校对 `current-context.md` 与 `completed-streams-history.md` 的 stream 切换结果。

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-810 --tasks-dir ".repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/sprint-001-secure-local-capture-and-redacted-secret-mutation/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`
6. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
7. `pnpm run check`

## 9. 执行记录

1. 2026-04-12：在 `TK-809` 完成 sprint closeout handoff 后创建本任务，等待 latest project-final clean round `resolved` 后执行。

## 10. 产出

1. 待执行：project-092 final closeout and active primary stream clearance
