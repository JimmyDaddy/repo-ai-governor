# project-114 sprint-005 zero-cli rehearsal summary

- Status: completed
- Date: 2026-04-18
- Evidence Time (UTC): `2026-04-18T07:53:44Z`
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-005-support-truth-migration-and-cli-deprecation-closeout`

## 1. Scope

1. Built-source checkout + extension-development host.
2. Built-source checkout + one locally generated VSIX / packaged extension root.
3. Supported human path only: bootstrap/readiness, diagnostics, governed repository operations, workflow authoring, run/review, and automation interaction inside VS Code.

## 2. Verification chain

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts` (`74/74` tests passed)
2. `pnpm run build` (passed)
3. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-sprint-005-vscode-distribution-report.json` (passed)
4. `pnpm pack --json --dry-run` (passed; `repo-ai-governor-0.0.1.tgz`, `2445` packed files)
5. `pnpm run check:ide-entry-smoke` (passed)
6. `pnpm run check:ide-docs-parity` (passed)

## 3. Zero-CLI human-path coverage

1. Bootstrap/readiness: Workbench Overview exposes workspace bootstrap plus readiness projection without requiring a manual CLI pre-step.
2. Diagnostics: `doctor` and `check` are launched from workbench-native commands and routed through the local orchestration service seam.
3. Governed repository operations: `adopt / host / verify / upgrade` now execute as service-backed workspace operations inside VS Code; compatibility bridge metadata remains evidence-only.
4. Workflow authoring and run-control: Workflow Studio plus native preview/create/edit actions cover the supported authoring path without session-shell handoff.
5. Review and automation: Execution Board, HITL Inbox, Review Queue, Review Detail, and Automation Queue keep day-to-day governed interaction inside the workbench.
6. CLI role after cutover: CLI remains available for automation, CI, scriptable, session-shell, and debugging use, but it is no longer a prerequisite for the supported VS Code human path.

## 4. Evidence artifacts

1. Scratch distribution report: `.tmp/project-114-sprint-005-vscode-distribution-report.json`
2. Immutable distribution snapshot: `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-vscode-distribution-report-20260418T075344Z.json`
3. Pack dry-run manifest: `.tmp/project-114-sprint-005-pack-dry-run.json`
4. Support contract freeze: `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-support-truth-contract.md`

## 5. Residual risk

1. Automated evidence already covers packaged root and extracted VSIX module smoke, sidecar smoke, pnpm metadata closure, symlink-safe payload, and IDE template smoke.
2. A real GUI extension-development-host launch or VS Code `Install from VSIX...` rehearsal remains additive manual evidence only.
3. `command -v code` returned no executable in this environment, so the optional GUI proof path was not executed in this rerun window.
