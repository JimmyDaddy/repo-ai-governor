# project-098 cli-exec runtime rollout completion audit summary

- Status: completed
- Date: 2026-04-13
- Audit Scope: `project-098-cli-exec-runtime-rollout`
- Completion Conclusion: `completed`

## 1. Completion conclusion

1. `project-098` is now `completed`.
2. Shared native `cli_exec` runtime rollout now covers `Codex`, `Claude Code`, and `GitHub Copilot` while preserving adapter-authored launch truth, cancellation truth, and additive diagnostics boundaries.
3. The explicit ACP seam remains internal-only, non-default, non-public, and non-canonical at project closeout.

## 2. Closeout outcome

1. `sprint-001` established the shared native process runtime and Codex lifecycle/liveness convergence without promoting a new transport truth.
2. `sprint-002` moved `Claude Code` and `GitHub Copilot` onto the shared runtime, hardened cross-platform termination handling, and closed the remaining launch-diagnostics failure-path gaps with regression coverage.
3. `sprint-003` isolated the provisional ACP seam behind internal boundaries, added config/public-boundary guardrails, and completed project-final review plus delivery closeout.
4. `project-098 / sprint-003` has fully closed and no longer occupies the default `current-context.md` execution surface.

## 3. Audit scope

1. `sprint-001-native-cli-runtime-foundation-and-codex-convergence`
2. `sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence`
3. `sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout`

## 4. Task completion statistics

1. Total implementation / closeout task cards currently materialized in project scope: `12`
2. Latest `TK` status `completed` count: `12 / 12`
3. Latest `CR` status `resolved` count: `4 / 4`
4. Remaining implementation or review gaps before project completion claim: `0`

## 5. Key evidence

1. `./plan.md`
2. `./sprint-001-native-cli-runtime-foundation-and-codex-convergence/plan.md`
3. `./sprint-001-native-cli-runtime-foundation-and-codex-convergence/review/resolved_code_review_working-tree-20260413-1400.md`
4. `./sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence/plan.md`
5. `./sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence/review/resolved_code_review_working-tree-20260413-1435.md`
6. `./sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout/plan.md`
7. `./sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout/review/resolved_code_review_working-tree-20260413-1502.md`
8. `./sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout/review/resolved_code_review_working-tree-20260413-1550.md`
9. `./sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout/tasks/TK-832-finalize-project-098-rollout-closeout-and-delivery-evidence-handoff.md`
10. `./sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout/tasks/checklist.md`
11. `./sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout/tasks/tasks.csv`
12. `../../../../packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
13. `../../../../packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts`
14. `../../../../packages/adapters/codex/src/codex-agent-adapter.ts`
15. `../../../../packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
16. `../../../../packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
17. `../../../../packages/config/test/config.unit.test.ts`
18. `../../../../.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
19. `../../../../.repo-ai-governor/context/current-context.md`
20. `../../../../.repo-ai-governor/context/completed-streams-history.md`

## 6. Delivered capability summary

1. Shared native `cli_exec` process ownership is now centralized in adapter-sdk while adapter-owned launch authoring, parser truth, and capability truth remain local to each adapter.
2. Launch diagnostics such as `selectedEntrypoint`, `shellWrapped`, `processTreePolicy`, and `spawnErrorCode` now behave as additive diagnostics across success and failure paths instead of silently disappearing on key parse-failure branches.
3. ACP experimentation now has an explicit internal seam and config guardrail, but no new public transport, support matrix entry, or adopter-facing support wording was introduced.

## 7. Verification evidence

1. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts`（通过）
2. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run build`（通过）
5. `pnpm run check`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
10. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 8. Residual risk and follow-up advice

1. If future work needs host-facing ACP transport, packaged-distribution support, or support-matrix/documentation uplift, it must be handled in a separate technical solution rather than extending this closed rollout implicitly.
2. The Codex / Claude Code / GitHub Copilot malformed-output smoke tests should remain the first regression signal to watch if upstream CLIs change their JSON/text event contracts.
