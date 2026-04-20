# project-116 sprint-005 rollout claim parity summary

- Status: completed
- Date: 2026-04-21
- Evidence Time (UTC): `2026-04-20T19:36:04Z`
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-005-clean-room-validation-and-rollout-closeout`

## 1. Final claims now safe

1. Public docs may now state that the supported plugin human path uses host-native `Connect Provider`, `Update API Key`, and `Reconnect Provider` across built-source checkout plus one locally generated packaged extension root / VSIX without requiring manual `credentialEnvVar` authoring.
2. Public docs may now state that raw API keys stay behind the secure prompt and the Governor managed secret backend, while durable config remains limited to non-secret provider defaults plus `credentialRef`.
3. Public docs may now state that the zero-env-var claim is evidence-backed not only by plugin controller/runtime/presentation coverage, but also by selector-first CLI onboarding and user-config regression coverage that keeps `credentialRef` truth from drifting back to env-var-first authoring.
4. Public docs must continue stating that CLI remains supported as an optional automation / CI / scriptable / session-shell / debugging path, including explicit headless `credentialEnvVar` compatibility scenarios outside the plugin-first human flow.

## 2. Conservative boundaries retained

1. Live remote-provider success remains outside the formal support claim.
2. A real GUI `Install from VSIX...` rehearsal or extension-development-host launch remains optional manual evidence.
3. The support claim still stops at built-source checkout plus one locally generated packaged extension root / VSIX; it does not extend to published npm/tgz install surfaces or Marketplace distribution.

## 3. Synchronized public surfaces

1. `apps/vscode-extension/README.md`
2. `docs/local-adoption-playbook.md`
3. `docs/local-adoption-playbook.zh-CN.md`
4. `docs/maintainer-validation-playbook.md`
5. `docs/maintainer-validation-playbook.zh-CN.md`
6. `docs/support-matrix.md`
7. `docs/support-matrix.zh-CN.md`

## 4. Verification chain

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts apps/cli/test/connect-phase2.integration.test.ts` (`133/133` tests passed)
2. `pnpm run build` (passed)
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` (`157/157` files, `1247/1247` tests passed)
4. `pnpm run release:pack-vscode-extension -- --report .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-extension-pack-report-20260420T193604Z.json` (passed)
5. `pnpm run release:verify-vscode-extension-distribution -- --output .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-distribution-report-20260420T193604Z.json` (passed)
6. `pnpm pack --json --dry-run` (passed; `repo-ai-governor-0.0.1.tgz`)
7. `pnpm run check:ide-entry-smoke` (passed)
8. `pnpm run check:ide-docs-parity` (passed)

## 5. Evidence artifacts

1. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-extension-pack-report-20260420T193604Z.json`
2. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-vscode-distribution-report-20260420T193604Z.json`
3. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-zero-env-var-clean-room-summary.md`
4. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-built-source-and-local-vsix-direct-onboarding-summary.md`
5. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-support-truth-boundary-handoff.md`

## 6. Residual risk

1. This closeout window proves host-native direct entry, secret-backed receipt persistence, selector-first zero-env-var compatibility, and packaged/extracted-VSIX truth; it does not prove remote-provider network success.
2. GUI-only proof remains additive rather than required, because the formal automated evidence boundary still stops at packaged-root and extracted-VSIX verification.
