# TK-660 finalize project-061 closeout and clear the active primary stream

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-current-surface-gap-task-decomposition-draft`
- Sprint: `sprint-001-project-sprint-task-package-decomposition`

## 1. 任务目标

在任务拆解 draft 输出后，把 `project-061 / sprint-001` 的 project、sprint、task ledger、completion audit、completed history 与当前上下文一次性收口到最终完成态。

## 2. Depends On

1. `TK-659`

## 3. 预期产物

1. `DA-660` project-final closeout handoff
2. `project-061` completion audit summary
3. `current-context.md` 与 `completed-streams-history.md` 最终 completed / idle 真值

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/plan.md`
4. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/sprint-001-project-sprint-task-package-decomposition/plan.md`
5. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/sprint-001-project-sprint-task-package-decomposition/tasks/TK-659-decompose-current-surface-gap-guide-into-project-sprint-and-task-packages.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `.repo-ai-governor/context/dev/project-060-current-app-feature-gap-priority-draft/sprint-001-current-surface-gap-classification-and-priority-draft/tasks/TK-658-finalize-project-060-closeout-and-clear-the-active-primary-stream.md`

## 6. 实施计划

1. 写回 project/sprint completion、completion audit 与 DA closeout handoff。
2. 同步 `current-context.md` 与 `completed-streams-history.md`。
3. 跑台账同步与治理检查，确认 docs-only 拆解窗口无漂移。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-660`
2. docs-only closeout：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `in_progress`；本轮 closeout 只收口拆解文档与治理写回。
2. 2026-04-08：已写入 `project-061` plan、sprint plan、completion audit 与 `DA-660`，并把拆解结果回链到新的 decomposition draft。
3. 2026-04-08：已把 `current-context.md` 恢复为 `idle`，并在 `completed-streams-history.md` 中登记 `stream-project-061-sprint-001`。
4. 2026-04-08：本轮为 docs-only closeout，已补跑治理同步检查，无需 `pnpm run build`，任务完成。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/project-061-current-surface-gap-task-decomposition-draft-completion-audit-summary.md`
2. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/sprint-001-project-sprint-task-package-decomposition/tasks/DA-660-project-061-final-closeout-and-draft-handoff.md`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/context/completed-streams-history.md`
