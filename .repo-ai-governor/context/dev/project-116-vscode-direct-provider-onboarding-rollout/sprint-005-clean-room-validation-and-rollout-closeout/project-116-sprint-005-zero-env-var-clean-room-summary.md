# project-116 sprint-005 zero-env-var clean-room summary

- Status: completed
- Date: 2026-04-21
- Evidence Time (UTC): `2026-04-20T19:36:04Z`
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-005-clean-room-validation-and-rollout-closeout`

## 1. Scope

1. Built-source checkout plus one locally generated packaged extension root / VSIX.
2. Plugin-first direct-provider-onboarding path only: `Connect Provider`, `Update API Key`, and `Reconnect Provider`.
3. Zero-env-var truth only: raw API key stays behind the secure prompt and managed secret backend, while durable config remains limited to non-secret provider defaults plus `credentialRef`.

## 2. Verification chain

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts apps/cli/test/connect-phase2.integration.test.ts` (`133/133` tests passed)
2. `pnpm run build` (passed)
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` (`157/157` files, `1247/1247` tests passed)
4. `pnpm run release:pack-vscode-extension -- --report .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-extension-pack-report-20260420T193604Z.json` (passed)
5. `pnpm run release:verify-vscode-extension-distribution -- --output .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-distribution-report-20260420T193604Z.json` (passed)

## 3. Zero-env-var clean-room coverage

1. VS Code controller/runtime/presentation coverage still keeps the plugin human path on direct API-key entry instead of manual `credentialEnvVar` authoring.
2. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts` still proves that `remote_api` onboarding does not synthesize a default credential env var when the canonical truth is already `credentialRef`-only.
3. `apps/cli/test/runtime/cli-user-config-projection-service.test.ts` still proves user-local remote-api defaults remain selector-first and zero-env-var when a `credentialRef` already exists.
4. `apps/cli/test/connect-phase2.integration.test.ts` still proves connect candidates preserve selector-first truth in the user-config path without forcing manual env-var authoring back into the plugin-first flow.
5. The sprint-005 packaged/extracted-VSIX verification rerun keeps both scratch workspaces isolated under `.tmp/release-vscode-extension-package/cli-backed-smoke-workspaces/**`, with `doctor` finishing at `pass=12 / warn=6 / fail=0` for both packaged-root and installed-VSIX paths.

## 4. Evidence artifacts

1. Pack report: `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-extension-pack-report-20260420T193604Z.json`
2. Immutable distribution snapshot: `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-distribution-report-20260420T193604Z.json`
3. Prior docs-refresh evidence summary: `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-built-source-and-local-vsix-direct-onboarding-summary.md`
4. Prior support-truth boundary handoff: `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-support-truth-boundary-handoff.md`

## 5. Residual risk

1. This zero-env-var claim is evidence-backed for built-source checkout plus one locally generated packaged extension root / VSIX only; it does not extend to Marketplace or published npm/tgz install surfaces.
2. Live remote-provider success is still outside the formal support claim; this window proves the host-native direct-entry, secret-backed receipt, readiness projection, and scratch-isolated packaged truth rather than remote network success.
3. A real GUI `Install from VSIX...` rehearsal remains optional manual evidence only.
