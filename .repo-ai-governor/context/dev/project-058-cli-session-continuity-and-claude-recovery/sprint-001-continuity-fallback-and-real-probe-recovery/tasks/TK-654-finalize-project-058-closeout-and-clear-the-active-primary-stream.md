# TK-654 finalize project-058 closeout and clear the active primary stream

- Status: completed
- Date: 2026-04-07
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-058-cli-session-continuity-and-claude-recovery`
- Sprint: `sprint-001-continuity-fallback-and-real-probe-recovery`

## 1. 任务目标

在 `TK-653` 完成后完成 `project-058` 的最终 closeout write-back，把 project / sprint / context / history 一次性同步到完成态，并清空当前 worktree 的 active primary stream。

## 2. Depends On

1. `TK-652`
2. `TK-653`

## 3. 预期产物

1. `DA-654-project-058-final-closeout-and-active-stream-clearance.md`
2. `project-058-cli-session-continuity-and-claude-recovery-completion-audit-summary.md`
3. 更新后的 `project-058` / `sprint-001` plan
4. 更新后的 `current-context.md` 与 `completed-streams-history.md`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
4. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/plan.md`
5. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/tasks/DA-653-sprint-001-closeout-and-project-final-closeout-activation-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/tasks/TK-652-fix-session-main-continuity-fallback-and-claude-code-real-path-cli-regression.md`
2. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/tasks/TK-653-sprint-001-exit-acceptance-and-follow-up-handoff-readiness.md`
3. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/tasks/DA-653-sprint-001-closeout-and-project-final-closeout-activation-handoff.md`

## 6. 实施计划

1. 产出 project-final closeout handoff 与 completion audit summary。
2. 将 `project-058` / `sprint-001` plan 恢复到最终 `completed` 真值，并同步 `current-context.md` 与 `completed-streams-history.md`。
3. 运行 task-ledger sync 与 governance checks，确认当前 worktree 不再保留 active primary stream。

## 7. Development Verification

1. 已校对 `project-058` 当前全部 `TK` 最新状态均进入终态。
2. 已校对 `current-context.md` 与 `completed-streams-history.md` 的 stream 切换结果。

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-654`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-07：任务在 `TK-653` 完成后创建，并在同一窗口进入 project-final closeout。
2. 2026-04-07：已写入 `DA-654` 与 `project-058` completion audit summary，并把 `project-058 / sprint-001` 恢复为最终 `completed` 真值。
3. 2026-04-07：已将当前 primary stream 从 `current-context.md` 移入 `completed-streams-history.md`，当前 worktree 不再保留 active primary stream。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/tasks/DA-654-project-058-final-closeout-and-active-stream-clearance.md`
2. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/project-058-cli-session-continuity-and-claude-recovery-completion-audit-summary.md`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/context/completed-streams-history.md`
