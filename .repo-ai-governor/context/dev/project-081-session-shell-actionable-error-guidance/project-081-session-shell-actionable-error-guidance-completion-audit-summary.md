# project-081 session-shell actionable error guidance completion audit summary

- Status: completed
- Date: 2026-04-11
- Audit Scope: `project-081-session-shell-actionable-error-guidance`
- Completion Conclusion: `completed`

## 1. Completion conclusion

1. `project-081` is now `completed`.
2. The repository now has audit-backed evidence that session shell can recover structured nested-command errors even when stdout contains repeated JSON payload lines.
3. The reported `connect requires adapters baseline in source config` case now renders actionable recovery guidance instead of raw JSON noise.

## 2. Closeout outcome

1. Session shell now attempts whole-payload JSON recovery first, then line-level JSON recovery, before falling back to raw stderr/stdout text.
2. Machine `next_action` values such as `inspect_governor_config` are now rendered as human-readable next steps in shell transcript summaries.
3. The `connect` missing-adapters-baseline error now recommends `init` for first-time setup or `workspace clear-config` plus `init` when an existing config looks stale or broken.

## 3. Audit scope

1. `sprint-001-connect-config-recovery-guidance`

## 4. Task completion statistics

1. Total implementation / closeout task cards currently materialized in project scope: `2`
2. Latest `TK` status `completed` count: `2 / 2`
3. Latest `CR` status `resolved` count: `0 / 0`
4. Remaining implementation or review gaps before project completion claim: `0`

## 5. Key evidence

1. `./plan.md`
2. `./sprint-001-connect-config-recovery-guidance/plan.md`
3. `./sprint-001-connect-config-recovery-guidance/tasks/TK-763-add-actionable-session-shell-recovery-guidance-for-structured-connect-errors.md`
4. `./sprint-001-connect-config-recovery-guidance/tasks/TK-764-finalize-project-081-closeout-and-completion-audit.md`
5. `./sprint-001-connect-config-recovery-guidance/tasks/DA-764-project-081-final-closeout-and-idle-context-writeback.md`
6. `./sprint-001-connect-config-recovery-guidance/tasks/checklist.md`
7. `./sprint-001-connect-config-recovery-guidance/tasks/tasks.csv`
8. `../../../../apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
9. `../../../../apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
10. `../../../../packages/shared/src/i18n/locales/en-us.ts`
11. `../../../../packages/shared/src/i18n/locales/zh-cn.ts`
12. `../../../../.repo-ai-governor/context/current-context.md`
13. `../../../../.repo-ai-governor/context/completed-streams-history.md`

## 6. Delivered capability summary

1. The shell no longer degrades repeated JSON error output into raw transcript spam when a recoverable `cli_output_v1` payload is present.
2. Error summaries now speak in user-executable recovery language instead of machine enum values.
3. The `connect` config-baseline failure path now tells users exactly when to use `init` and when to reset config through `workspace clear-config`.

## 7. Verification evidence

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `node ./scripts/governance/check-i18n-parity-fallback.js`（通过）
3. `pnpm run build`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 8. Next-stream recommendation

1. No next primary stream is currently registered.
2. If future command families want similar recovery guidance, they should extend the same structured-error presenter path instead of emitting command-specific raw JSON fallbacks.

## 9. Residual risk and follow-up advice

1. This change improves presenter behavior only; it does not change the underlying `connect` validation rules.
2. Other command families with distinct structured-error recovery needs may still require dedicated presenter guidance if their `next_action` values are too abstract for end users.
