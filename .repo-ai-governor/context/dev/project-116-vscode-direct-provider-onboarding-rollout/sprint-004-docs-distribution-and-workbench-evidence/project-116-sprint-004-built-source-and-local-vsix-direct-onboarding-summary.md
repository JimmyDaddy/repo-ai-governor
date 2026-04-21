# project-116 sprint-004 built-source and local VSIX direct-onboarding summary

- Status: completed
- Date: 2026-04-21
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-004-docs-distribution-and-workbench-evidence`
- Scope: `TK-1013`, `TK-1014`

## 1. Summary

1. Built-source checkout and one locally generated packaged extension root / VSIX now carry real evidence for the direct-provider-onboarding docs refresh.
2. The evidence-backed human path remains host-native:
   - `Connect Provider` captures the provider/model/default endpoint plus one raw API key through the secure prompt.
   - `Update API Key` rotates the managed secret without asking the user to reopen CLI-first `credentialEnvVar` authoring.
   - `Reconnect Provider` reuses the existing managed selector path instead of inventing a second readiness taxonomy.
3. Persistent truth remains constrained to non-secret provider defaults plus `credentialRef`; raw API-key content stays in the Governor managed secret backend.
4. The wording uplift is intentionally conservative: this sprint proves the built-source / local-VSIX evidence window only. The final zero-env-var clean-room rollout claim still belongs to `sprint-005`.

## 2. Evidence Window

1. Targeted plugin direct-onboarding regression:
   - `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - Result: `3` files / `87` tests passed.
2. Build baseline:
   - `pnpm run build`
   - Result: passed.
3. Package-scoped regression baseline:
   - `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - Result: `157` files / `1247` tests passed.
4. Packaged extension report:
   - `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-vscode-extension-pack-report-20260420T185446Z.json`
   - Result: packaged `cjhdev.repo-ai-governor-vscode@0.0.1` into one local VSIX with the expected runtime payload closure.
5. Distribution verification report:
   - `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-vscode-distribution-report-20260420T185446Z.json`
   - Result: packaged root and extracted VSIX both passed module smoke, sidecar smoke, and CLI-backed secure-authoring plus scratch-isolated `doctor` capture.

## 3. Key Facts From The Distribution Snapshot

1. Packaged root:
   - `serviceLifecycle=ready`
   - `doctorSummary="Doctor completed with attach_mode=read_write."`
   - `doctorCheckTotals={pass:12,warn:6,fail:0}`
2. Extracted VSIX:
   - `serviceLifecycle=ready`
   - `doctorSummary="Doctor completed with attach_mode=read_write."`
   - `doctorCheckTotals={pass:12,warn:6,fail:0}`
3. Both packaged/extracted paths resolved their smoke workspaces inside `.tmp/release-vscode-extension-package/cli-backed-smoke-workspaces/**`, so the docs refresh is backed by isolated packaged-surface evidence rather than the maintainer's live workspace state.

## 4. Safe Claim Boundary

1. It is now safe for README/playbook/support wording to say that the supported VS Code human path includes host-native direct provider onboarding on built-source checkout plus one locally generated VSIX / packaged extension root.
2. It is not yet safe to claim that the entire rollout is closed clean on zero-env-var proof alone; `sprint-005` still owns the separate clean-room rehearsal and final claim-parity review.
