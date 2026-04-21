# project-116 sprint-004 support-truth boundary handoff

- Status: completed
- Date: 2026-04-21
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-004-docs-distribution-and-workbench-evidence`
- Scope: `TK-1015`

## 1. Claims Now Safe

1. Public docs may now say that the supported VS Code human path includes host-native `Connect Provider`, `Update API Key`, and `Reconnect Provider` on built-source checkout plus one locally generated VSIX / packaged extension root.
2. Public docs may now say that the plugin human path no longer requires manual `credentialEnvVar` authoring before the extension becomes useful.
3. Public docs may now say that raw API keys stay behind the secure prompt and the Governor managed secret backend, while durable config remains limited to non-secret provider defaults plus `credentialRef`.
4. Public docs must continue saying that CLI/headless `credentialEnvVar` flows remain supported as compatibility paths outside the plugin-first human flow.

## 2. Claims Still Deferred To Sprint-005

1. Final zero-env-var clean-room rollout proof.
2. Final project closeout wording and completion audit.
3. Any claim that live remote-provider success was validated end-to-end in the public packaged path.

## 3. Updated Public Surfaces

1. `README.md`
2. `README.zh-CN.md`
3. `apps/vscode-extension/README.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`
8. `docs/support-matrix.md`
9. `docs/support-matrix.zh-CN.md`

## 4. Sprint-005 Inputs

1. Reuse `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-vscode-distribution-report-20260420T185446Z.json` as the immutable packaged/local-VSIX evidence snapshot.
2. Reuse `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-built-source-and-local-vsix-direct-onboarding-summary.md` as the authoritative docs-refresh evidence summary.
3. Add a separate sprint-005 zero-env-var clean-room summary before promoting the rollout to final project closeout.
