# project-058 cli session continuity and claude recovery completion audit summary

- Status: completed
- Date: 2026-04-07
- Audit Scope: `project-058-cli-session-continuity-and-claude-recovery`
- Completion Conclusion: `completed`

## 1. Completion conclusion

1. `project-058` is now `completed`.
2. `TK-654 / DA-654` has completed the final closeout write-back and removed the active primary stream from the current worktree.
3. The two user-reported CLI regressions are now backed by implementation, regression tests, same-window build evidence, and a compiled local `Claude Code` probe recovery check.

## 2. Closeout outcome

1. `session.main` now injects a lightweight session note fallback when provider backend continuation is `unsupported`, so follow-up turns retain a minimal continuity surface instead of restarting cold.
2. `Claude Code` real-path probe / invoke no longer misroutes the prompt into the variadic `--add-dir` argument list, so a locally available `claude` binary can be detected truthfully again.
3. The CLI transcript copy now states the product truth more accurately: backend continuation may be unavailable, but the CLI will fall back to a lightweight session summary when possible.
4. `project-058 / sprint-001` has fully closed and no longer occupies the default `current-context.md` execution surface.

## 3. Audit scope

1. `sprint-001-continuity-fallback-and-real-probe-recovery`

## 4. Task completion statistics

1. Total implementation / closeout tasks currently materialized in project scope: `3`
2. Latest `TK` status `completed` count: `3 / 3`
3. Latest `CR` status `resolved` count: `0 / 0`
4. Remaining implementation or review gaps before project completion claim: `0`

## 5. Key evidence

1. `./plan.md`
2. `./sprint-001-continuity-fallback-and-real-probe-recovery/plan.md`
3. `./sprint-001-continuity-fallback-and-real-probe-recovery/tasks/TK-652-fix-session-main-continuity-fallback-and-claude-code-real-path-cli-regression.md`
4. `./sprint-001-continuity-fallback-and-real-probe-recovery/tasks/TK-653-sprint-001-exit-acceptance-and-follow-up-handoff-readiness.md`
5. `./sprint-001-continuity-fallback-and-real-probe-recovery/tasks/TK-654-finalize-project-058-closeout-and-clear-the-active-primary-stream.md`
6. `./sprint-001-continuity-fallback-and-real-probe-recovery/tasks/DA-653-sprint-001-closeout-and-project-final-closeout-activation-handoff.md`
7. `./sprint-001-continuity-fallback-and-real-probe-recovery/tasks/DA-654-project-058-final-closeout-and-active-stream-clearance.md`
8. `./sprint-001-continuity-fallback-and-real-probe-recovery/tasks/checklist.md`
9. `./sprint-001-continuity-fallback-and-real-probe-recovery/tasks/tasks.csv`
10. `../../../../apps/cli/src/runtime/session-main-supervisor-runtime.ts`
11. `../../../../packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
12. `../../../../packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
13. `../../../../packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
14. `../../../../packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
15. `../../../../apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
16. `../../../../apps/cli/test/runtime/session-shell-transcript-store.test.ts`
17. `../../../../packages/shared/src/i18n/locales/en-us.ts`
18. `../../../../packages/shared/src/i18n/locales/zh-cn.ts`
19. `../../../../.repo-ai-governor/context/current-context.md`
20. `../../../../.repo-ai-governor/context/completed-streams-history.md`

## 6. Delivered capability summary

1. CLI `session.main` now preserves a truthful, lightweight continuity path even when backend provider conversation reuse is unavailable.
2. Local `claude` availability can now be surfaced correctly through the `Claude Code` adapter probe path instead of being hidden behind a CLI argument-ordering regression.
3. The CLI now communicates its continuity fallback behavior more honestly to users, reducing the gap between observable behavior and transcript messaging.

## 7. Verification evidence

1. `pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. compiled `Claude Code` adapter probe returned `availabilityStatus=available`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 8. Next-stream recommendation

1. No next primary stream is currently registered.
2. If another workspace task is activated later, reload `current-context.md` first and register the new stream there before execution.

## 9. Residual risk and follow-up advice

1. The current continuity behavior is still a lightweight fallback, not full provider-native conversation continuation; if durable backend continuation support is added later, this project should be treated as the truthful degradation baseline rather than the final state.
2. The `Claude Code` recovery depends on the current `claude` CLI argument contract; if upstream CLI parsing changes again, the real-path smoke test should remain the first regression signal to watch.
