# TK-658 finalize project-060 closeout and clear the active primary stream

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-060-current-app-feature-gap-priority-draft`
- Sprint: `sprint-001-current-surface-gap-classification-and-priority-draft`

## 1. 任务目标

在 draft 输出完成后，把 `project-060 / sprint-001` 的 project、sprint、task ledger、completion audit、completed history 与当前上下文一次性同步到最终完成态，避免留下悬挂的 active stream。

## 2. Depends On

1. `TK-657`

## 3. 预期产物

1. `DA-658` project-final closeout handoff
2. completed `project-060` audit summary
3. `current-context.md` 与 `completed-streams-history.md` 最终 completed / idle 真值

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-060-current-app-feature-gap-priority-draft/plan.md`
4. `.repo-ai-governor/context/dev/project-060-current-app-feature-gap-priority-draft/sprint-001-current-surface-gap-classification-and-priority-draft/plan.md`
5. `.repo-ai-governor/context/dev/project-060-current-app-feature-gap-priority-draft/sprint-001-current-surface-gap-classification-and-priority-draft/tasks/TK-657-analyze-current-app-feature-gaps-baseline-surfaces-and-priority-draft.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-059-cli-provider-continuity-fallback-truthfulness/sprint-001-unsupported-fallback-presenter-alignment/tasks/TK-656-finalize-project-059-closeout-and-clear-the-active-primary-stream.md`

## 6. 实施计划

1. 写回 project/sprint completion 与 project-level audit summary。
2. 同步 `current-context.md` 与 `completed-streams-history.md`。
3. 跑台账同步与治理检查，确认 docs-only closeout 无漂移。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-658`
2. docs-only closeout：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `in_progress`；本轮 closeout 只收口分析文档与治理写回。
2. 2026-04-08：已写入 `project-060` plan、sprint plan、completion audit 与 `DA-658`，并把当前分析任务回链到新 draft 文档。
3. 2026-04-08：已把 `current-context.md` 恢复为 `idle`，并在 `completed-streams-history.md` 中登记 `stream-project-060-sprint-001`。
4. 2026-04-08：本轮为 docs-only closeout，已补跑治理同步检查，无需 `pnpm run build`，任务完成。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-060-current-app-feature-gap-priority-draft/project-060-current-app-feature-gap-priority-draft-completion-audit-summary.md`
2. `.repo-ai-governor/context/dev/project-060-current-app-feature-gap-priority-draft/sprint-001-current-surface-gap-classification-and-priority-draft/tasks/DA-658-project-060-final-closeout-and-draft-handoff.md`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/context/completed-streams-history.md`
