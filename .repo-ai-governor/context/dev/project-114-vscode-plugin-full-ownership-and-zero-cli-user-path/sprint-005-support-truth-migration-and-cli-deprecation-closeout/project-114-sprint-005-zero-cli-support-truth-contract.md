# project-114 sprint-005 zero-cli support truth contract

- Status: completed
- Date: 2026-04-18
- Scope: `built-source checkout` + `local VSIX / packaged extension root`
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-005-support-truth-migration-and-cli-deprecation-closeout`

## 1. Contract freeze

1. VS Code is the primary human-facing workbench for the supported built-source checkout and local VSIX paths.
2. Supported human paths inside VS Code now include:
   - bootstrap and readiness projection
   - `doctor` and `check`
   - secure authoring, user settings, and managed-secret readiness
   - `adopt / host / verify / upgrade`
   - workflow preview, create, and edit
   - execution, review, HITL, and automation interaction
3. CLI remains supported for automation, CI, scriptable usage, session-shell flows, and debugging, but it is no longer a required user prerequisite for the supported VS Code workbench paths.
4. Extension UI continues to consume `local_orchestration_service` query/command seams only. The extension does not own shadow task, workflow, execution, or policy state.
5. Trust-sensitive actions stay behind VS Code `Workspace Trust`.
6. Support remains limited to built-source checkout plus one locally generated VSIX / packaged extension root. Marketplace delivery and published npm/tgz extension install surfaces remain unsupported.

## 2. Evidence gate

1. Public support wording may only stay promoted when the sprint-005 evidence window includes:
   - extension workbench/runtime verification
   - one fresh packaged-distribution verification report with packaged-root + extracted-VSIX module smoke, sidecar smoke, and CLI-backed secure-authoring + `doctor` smoke
   - `pnpm pack --json --dry-run`
   - `pnpm run check:ide-entry-smoke`
   - `pnpm run check:ide-docs-parity`
   - one sprint-local zero-cli rehearsal summary
2. Manual GUI proof such as a real extension-development-host launch or VS Code `Install from VSIX...` session is additive evidence, not the only acceptable truth source for this sprint.

## 3. Documentation posture

1. `apps/vscode-extension/README.md` should describe the extension as the primary human-facing workbench for the supported VS Code paths.
2. `docs/support-matrix*.md` should state that CLI is optional for automation/scriptable/session-shell usage rather than a required prerequisite for supported VS Code users.
3. `docs/local-adoption-playbook*.md` should explain how built-source checkout and local VSIX users stay inside VS Code for the supported human path.
4. `docs/maintainer-validation-playbook*.md` should route proof to the sprint-local immutable evidence snapshot instead of leaving public truth coupled to a mutable `.tmp` file.

## 4. Residual risk

1. This contract does not promise a packaged Marketplace extension, published npm/tgz extension install flow, or a replacement for headless CLI automation.
2. If future VS Code rollout work widens the support surface again, it should do so in a separate project with a new evidence bundle and support-truth review.
