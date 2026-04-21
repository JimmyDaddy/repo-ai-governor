# project-116 vscode direct-provider-onboarding rollout completion audit summary

- Status: completed
- Date: 2026-04-21
- Audit Scope: `project-116-vscode-direct-provider-onboarding-rollout`
- Completion Conclusion: `completed`

## 1. Completion conclusion

1. `project-116` is now `completed`.
2. The supported VS Code human path now owns direct provider onboarding on built-source checkout plus one locally generated packaged extension root / VSIX without sending users back to manual `credentialEnvVar` authoring.
3. CLI remains supported for automation, CI, scriptable, session-shell, headless, and debugging use; the project removed the plugin-first human prerequisite, not the underlying headless compatibility surface.
4. The project-final delegated reviewer loop finished clean at `CR-002`, and the workspace has been restored to an idle primary-stream state after sprint-005 closeout write-back.

## 2. Closeout outcome so far

1. sprint-001 froze the provider-onboarding owner split and service facade boundary.
2. sprint-002 delivered plugin-native direct API-key entry with managed-secret-backed `credentialRef` persistence.
3. sprint-003 aligned readiness CTA and provider lifecycle flows around host-native `Connect Provider`, `Update API Key`, and `Reconnect Provider`.
4. sprint-004 refreshed public docs and packaged/local-VSIX evidence while keeping the support wording conservative ahead of sprint-005.
5. sprint-005 completed the zero-env-var clean-room evidence window, the public claim-parity refresh, and the final project closeout proof needed to promote rollout truth to completed.

## 3. Audit scope

1. `sprint-001-contract-and-provider-onboarding-facade`
2. `sprint-002-plugin-native-direct-api-key-entry`
3. `sprint-003-readiness-cta-and-provider-lifecycle`
4. `sprint-004-docs-distribution-and-workbench-evidence`
5. `sprint-005-clean-room-validation-and-rollout-closeout`

## 4. Task completion statistics

1. Total tracked task cards currently materialized in project scope: `25`
2. Latest `TK` status `completed` count: `19 / 19`
3. Latest `CR` status `resolved` count: `6 / 6`
4. Remaining implementation or review gaps before project completion claim: `0`

## 5. Key evidence

1. `./plan.md`
2. `./sprint-005-clean-room-validation-and-rollout-closeout/plan.md`
3. `./sprint-005-clean-room-validation-and-rollout-closeout/tasks/checklist.md`
4. `./sprint-005-clean-room-validation-and-rollout-closeout/tasks/tasks.csv`
5. `./sprint-005-clean-room-validation-and-rollout-closeout/tasks/TK-1018-close-rollout-project-and-publish-completion-audit.md`
6. `./sprint-005-clean-room-validation-and-rollout-closeout/tasks/CR-002.md`
7. `./sprint-005-clean-room-validation-and-rollout-closeout/review/resolved_code_review_working-tree-20260421-0416.md`
8. `../../../../.repo-ai-governor/context/current-context.md`
9. `../../../../.repo-ai-governor/context/completed-streams-history.md`
10. `./sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-zero-env-var-clean-room-summary.md`
11. `./sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-rollout-claim-parity-summary.md`
12. `../../../../apps/vscode-extension/README.md`
13. `../../../../docs/local-adoption-playbook.md`
14. `../../../../docs/local-adoption-playbook.zh-CN.md`
15. `../../../../docs/maintainer-validation-playbook.md`
16. `../../../../docs/maintainer-validation-playbook.zh-CN.md`
17. `../../../../docs/support-matrix.md`
18. `../../../../docs/support-matrix.zh-CN.md`

## 6. Delivered capability summary

1. The supported VS Code human path now owns direct provider onboarding on built-source checkout plus one locally generated packaged extension root / VSIX without sending users back to manual `credentialEnvVar` authoring.
2. The plugin keeps raw API-key entry behind the secure prompt and the managed secret backend while persisting only non-secret provider defaults plus `credentialRef`.
3. The final public wording now treats CLI as an optional automation / CI / scriptable / session-shell / debugging path, while keeping headless `credentialEnvVar` compatibility available outside the plugin-first human path.

## 7. Verification evidence

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts apps/cli/test/connect-phase2.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run release:pack-vscode-extension -- --report .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-extension-pack-report-20260420T193604Z.json`（通过）
5. `pnpm run release:verify-vscode-extension-distribution -- --output .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-distribution-report-20260420T193604Z.json`（通过）
6. `pnpm pack --json --dry-run`（通过）
7. `pnpm run check:ide-entry-smoke`（通过）
8. `pnpm run check:ide-docs-parity`（通过）
9. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
10. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
11. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
12. `node ./scripts/governance/check-worktree-review-target.js`（通过）
13. `pnpm run check`（通过）
14. Current closeout delta after `CR-002` is governance-only; no executable code changed after the real `pnpm run build` evidence above.

## 8. Remaining blockers and follow-up advice

1. The supported claim is evidence-backed for built-source checkout and local VSIX / packaged extension-root only; Marketplace and published npm/tgz install surfaces remain outside the supported path.
2. Live remote-provider success was not required for completion and is not claimed here; the completion boundary is direct-key entry, secret-backed receipt flow, readiness projection, and conservative support truth.
3. Optional manual GUI proof such as a real extension-development-host launch or VS Code `Install from VSIX...` remains additive evidence rather than an automated closeout requirement.
