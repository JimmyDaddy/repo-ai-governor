# project-080 session-shell direct handoff default completion audit summary

- Status: completed
- Date: 2026-04-11
- Audit Scope: `project-080-session-shell-direct-handoff-default`
- Completion Conclusion: `completed`

## 1. Completion conclusion

1. `project-080` is now `completed`.
2. The repository now has audit-backed evidence that session shell governed handoffs default to `direct_execute` instead of shell-owned `preview + confirm`.
3. The reported `connect` failure has a concrete root cause: source config was missing the required `adapters` baseline, so removing preview-confirm does not mask or change that validation behavior.

## 2. Closeout outcome

1. `connect`、`workspace switch-branch`、`run`、`workflow` and `plan sync` now execute directly by default from session shell while keeping compatibility support for legacy `/confirm` continuity.
2. `/confirm` and `/cancel` are no longer advertised in the default slash palette or shortcut hint text.
3. Shell/orchestration technical-solution docs and local adoption guidance now describe direct governed handoff as the baseline interaction model.

## 3. Audit scope

1. `sprint-001-remove-shell-preview-confirm-default`

## 4. Task completion statistics

1. Total implementation / closeout task cards currently materialized in project scope: `2`
2. Latest `TK` status `completed` count: `2 / 2`
3. Latest `CR` status `resolved` count: `0 / 0`
4. Remaining implementation or review gaps before project completion claim: `0`

## 5. Key evidence

1. `./plan.md`
2. `./sprint-001-remove-shell-preview-confirm-default/plan.md`
3. `./sprint-001-remove-shell-preview-confirm-default/tasks/TK-761-remove-shell-owned-preview-confirm-default-for-governed-session-commands.md`
4. `./sprint-001-remove-shell-preview-confirm-default/tasks/TK-762-finalize-project-080-closeout-and-completion-audit.md`
5. `./sprint-001-remove-shell-preview-confirm-default/tasks/DA-762-project-080-final-closeout-and-idle-context-writeback.md`
6. `./sprint-001-remove-shell-preview-confirm-default/tasks/checklist.md`
7. `./sprint-001-remove-shell-preview-confirm-default/tasks/tasks.csv`
8. `../../../../apps/cli/src/runtime/agent-onboarding-runtime.ts`
9. `../../../../apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
10. `../../../../packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
11. `../../../../packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
12. `../../../../.repo-ai-governor/context/current-context.md`
13. `../../../../.repo-ai-governor/context/completed-streams-history.md`

## 6. Delivered capability summary

1. The shell no longer forces an extra preview-confirm hop for governed direct-execute commands that already have clear scope and deterministic execution contracts.
2. Real confirmation boundaries remain available, but they are now expected to live in command-specific contracts or service-owned policy/HITL gates rather than generic shell chrome.
3. The `connect` onboarding path still validates source config rigorously and will continue to fail fast when `adapters` baseline is missing.

## 7. Verification evidence

1. `pnpm exec vitest run apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 8. Next-stream recommendation

1. No next primary stream is currently registered.
2. If a future change wants to reintroduce confirmation for some commands, it should be modeled as command-owned or policy-owned explicit confirmation instead of restoring shell-global preview-confirm.

## 9. Residual risk and follow-up advice

1. Hidden compatibility support for `/confirm` and `/cancel` remains in place, so legacy pending-preview continuity can still be resumed if the service explicitly requests it.
2. `connect` failures caused by missing `adapters` baseline still require config remediation; direct execution only removes redundant shell ceremony, not onboarding validation.
