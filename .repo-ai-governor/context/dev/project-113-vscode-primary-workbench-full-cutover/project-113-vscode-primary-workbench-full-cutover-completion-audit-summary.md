# project-113 vscode primary workbench full cutover completion audit summary

- Status: completed
- Date: 2026-04-18
- Audit Scope: `project-113-vscode-primary-workbench-full-cutover`
- Completion Conclusion: `completed`

## 1. Completion conclusion

1. `project-113` is now `completed`.
2. The VS Code governance workbench has completed the planned Phase D through Phase H cutover and now holds a verified `primary_workbench_claim` for built-source checkout plus local VSIX / packaged extension root usage.
3. The project-final delegated reviewer loop finished clean at `CR-008`, and the worktree has been returned to an idle primary-stream state.

## 2. Closeout outcome

1. Phase D locked activation fallback so `repoAiGovernor.refresh`, tree views, webviews, and workbench surfaces remain available even when `vscode.chat` is unavailable.
2. Phase E turned sidecar/query restore failures into degraded-but-renderable review detail and workflow studio surfaces instead of throwing or hanging on loading.
3. Phase F and Phase G completed secure authoring, settings/secret readiness, workflow authoring, governed run-control, and continuity UX without regressing the degraded fallback contract.
4. Phase H completed packaged VSIX dependency closure, sidecar/readiness verification, symlink payload guarding, immutable distribution evidence snapshotting, and support-truth promotion to `primary_workbench_claim`.

## 3. Audit scope

1. `sprint-001-phase-d-onboarding-cutover`
2. `sprint-002-phase-e-operations-cutover`
3. `sprint-003-phase-f-secure-authoring-and-user-settings`
4. `sprint-004-phase-g-workflow-authoring-and-run-control`
5. `sprint-005-phase-h-support-promotion-and-distribution-readiness`

## 4. Task completion statistics

1. Total tracked task cards currently materialized in project scope: `39`
2. Latest `TK` status `completed` count: `21 / 21`
3. Latest `CR` status `resolved` count: `18 / 18`
4. Remaining implementation or review gaps before project completion claim: `0`

## 5. Key evidence

1. `./plan.md`
2. `./sprint-001-phase-d-onboarding-cutover/plan.md`
3. `./sprint-002-phase-e-operations-cutover/plan.md`
4. `./sprint-003-phase-f-secure-authoring-and-user-settings/plan.md`
5. `./sprint-004-phase-g-workflow-authoring-and-run-control/plan.md`
6. `./sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md`
7. `./sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/checklist.md`
8. `./sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/tasks.csv`
9. `./sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-008.md`
10. `./sprint-005-phase-h-support-promotion-and-distribution-readiness/review/resolved_code_review_working-tree-20260418-0205.md`
11. `./sprint-005-phase-h-support-promotion-and-distribution-readiness/project-113-sprint-005-vscode-distribution-report-20260417T171401Z.json`
12. `../../../../apps/vscode-extension/README.md`
13. `../../../../docs/support-matrix.md`
14. `../../../../docs/support-matrix.zh-CN.md`
15. `../../../../docs/local-adoption-playbook.md`
16. `../../../../docs/local-adoption-playbook.zh-CN.md`
17. `../../../../docs/maintainer-validation-playbook.md`
18. `../../../../docs/maintainer-validation-playbook.zh-CN.md`
19. `../../../../.repo-ai-governor/context/current-context.md`
20. `../../../../.repo-ai-governor/context/completed-streams-history.md`

## 6. Delivered capability summary

1. VS Code activation now degrades safely when chat capability is missing, which keeps repository development and governance entry points available instead of failing activation.
2. Workbench-side review detail, workflow studio, queue overview, execution board, and HITL inbox surfaces now recover through empty/degraded service-backed DTOs rather than hard failures.
3. The packaged extension distribution path now has auditable evidence for package-root and extracted-VSIX module smoke, sidecar smoke, pnpm metadata closure, symlink guardrails, and immutable public-support evidence backlinks.

## 7. Verification evidence

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
5. `pnpm run check:ide-docs-parity`（通过）
6. `pnpm run check`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过）
11. Current closeout delta after `CR-008` is governance-only; no executable code changed after the reviewer-backed build evidence above, so no extra post-closeout build is required.

## 8. Residual risk and follow-up advice

1. The support claim is evidence-backed for built-source checkout and local VSIX / packaged extension root only; Marketplace and published npm/tgz install surfaces remain unsupported.
2. Automated evidence still does not replace optional manual GUI proof such as a real `code --install-extension` run and host launch.
3. Future follow-up work should treat new workflow studio or support-claim expansion as a separate project so the current primary-workbench boundary stays stable and auditable.
