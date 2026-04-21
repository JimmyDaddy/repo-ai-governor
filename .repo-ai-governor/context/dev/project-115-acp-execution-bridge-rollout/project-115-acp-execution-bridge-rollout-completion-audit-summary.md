# project-115 acp execution bridge rollout completion audit summary

- Status: completed
- Date: 2026-04-20
- Audit Scope: `project-115-acp-execution-bridge-rollout`
- Completion Conclusion: `completed`

## 1. Completion conclusion

1. `project-115` is now `completed`.
2. The repository now has audit-backed evidence that `acp_exec` is a distinct execution transport rather than a `cli_exec` alias, with invoke/stream shared-turn semantics, fail-closed host-operation bridges, and clean-room evidence captured across runtime-service and packaged-distribution surfaces.
3. The final sprint kept external ACP consumer rehearsal conservative: local external-consumer availability was not present, so the project recorded optional unavailable evidence instead of overstating external interoperability support.
4. Project closeout truth is aligned across project/sprint plans, task ledgers, review artifacts, `current-context.md`, completed history, and the technical-solution delivery registry.

## 2. Closeout outcome

1. sprint-001 froze ACP execution ownership, runtime split, and shared invocation-state boundaries without promoting ACP-local ids into canonical session truth.
2. sprint-002 landed real `acp_exec` invoke/stream/cancel execution and the shared-turn replay contract while preventing `cli_exec` aliasing and double execution.
3. sprint-003 hardened permission, terminal, and filesystem bridges with capability-gated fail-closed behavior and cleanup-safe cancel semantics.
4. sprint-004 promoted ACP execution evidence into source-checkout, packaged-distribution, and runtime-service clean-room proof with tracked receipts and provenance.
5. sprint-005 recorded optional external-consumer unavailability, revalidated conservative support wording, and closed the rollout without widening the claim beyond evidence-backed readiness / bootstrap surfaces.

## 3. Audit scope

1. `sprint-001-contract-and-runtime-decomposition`
2. `sprint-002-executable-acp-exec-baseline`
3. `sprint-003-permission-terminal-filesystem-bridge-hardening`
4. `sprint-004-clean-room-execution-and-packaged-evidence`
5. `sprint-005-external-interoperability-and-rollout-closeout`

## 4. Task completion statistics

1. Total tracked task cards currently materialized in project scope: `30`
2. Latest `TK` status `completed` count: `18 / 18`
3. Latest `CR` status `resolved` count: `12 / 12`
4. Remaining implementation or review gaps before project completion claim: `0`

## 5. Key evidence

1. `./plan.md`
2. `./sprint-001-contract-and-runtime-decomposition/plan.md`
3. `./sprint-002-executable-acp-exec-baseline/plan.md`
4. `./sprint-003-permission-terminal-filesystem-bridge-hardening/plan.md`
5. `./sprint-004-clean-room-execution-and-packaged-evidence/plan.md`
6. `./sprint-005-external-interoperability-and-rollout-closeout/plan.md`
7. `./sprint-004-clean-room-execution-and-packaged-evidence/tasks/DA-1000-sprint-004-clean-room-execution-evidence-and-sprint-005-activation-handoff.md`
8. `./sprint-005-external-interoperability-and-rollout-closeout/tasks/DA-1001-optional-external-acp-consumer-availability-and-rehearsal-disposition.md`
9. `./sprint-005-external-interoperability-and-rollout-closeout/tasks/DA-1002-support-wording-boundary-review-and-conservative-rollout-disposition.md`
10. `./sprint-005-external-interoperability-and-rollout-closeout/review/resolved_code_review_working-tree-20260420-2056.md`
11. `./sprint-005-external-interoperability-and-rollout-closeout/tasks/TK-1003-close-rollout-project-and-publish-completion-audit.md`
12. `./sprint-005-external-interoperability-and-rollout-closeout/tasks/DA-1003-project-115-final-closeout-and-project-116-activation-handoff.md`
13. `./sprint-005-external-interoperability-and-rollout-closeout/tasks/checklist.md`
14. `./sprint-005-external-interoperability-and-rollout-closeout/tasks/tasks.csv`
15. `../../../../.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
16. `../../../../docs/local-adoption-playbook.md`
17. `../../../../docs/local-adoption-playbook.zh-CN.md`
18. `../../../../docs/support-matrix.md`
19. `../../../../docs/support-matrix.zh-CN.md`
20. `../../../../.repo-ai-governor/context/current-context.md`
21. `../../../../.repo-ai-governor/context/completed-streams-history.md`
22. `../../../../.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 6. Delivered capability summary

1. `acp_exec` now has evidence-backed transport-scoped execution truth for invoke, stream attachment, permission bridging, host-operation replay, and cancel cleanup, while remaining additive to canonical session truth.
2. ACP bridge behavior now stays fail-closed when capability facts or correlation inputs are insufficient; it does not silently fall back to `cli_exec`.
3. Runtime-service and packaged-distribution readiness now consume refreshed clean-room evidence, while public support wording remains conservative until real external-consumer interoperability proof exists.

## 7. Verification evidence

1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --acp-execution-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-115-sprint-004-acp-cleanroom-report.json`
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run build`
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
10. `pnpm run check`（通过）

## 8. Next-stream recommendation

1. The next primary stream should be `project-116-vscode-direct-provider-onboarding-rollout / sprint-001-contract-and-provider-onboarding-facade`.
2. The first boundary should stay contract-first: freeze the provider-onboarding facade, owner split, and direct API-key / secret-backed `credentialRef` boundary before touching plugin UX or support wording.

## 9. Residual risk and follow-up advice

1. External ACP consumer interoperability remains intentionally optional and unavailable in this local environment; a future follow-up can add real consumer rehearsal only when a real local consumer exists.
2. Final closeout summaries must continue to preserve the conservative wording that ACP support is evidence-backed for readiness / bootstrap surfaces, not blanket external-consumer execution parity.
