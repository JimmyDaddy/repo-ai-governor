# Maintainer Validation Playbook

## 1. Audience

This document is for people maintaining, releasing, or validating `repo-ai-governor` itself. It is intentionally separate from the adopter-facing README and local adoption playbook.

Use this playbook when you need to:

1. Rehearse packaged delivery surfaces.
2. Validate real-project interactive behavior before rollout.
3. Run clean-room and GA-style verification from the governor repository.

### 1.1 Formal Support Truth Route

1. Use `docs/support-matrix.md` as the single public support truth surface; `## 9. GA Support Truthfulness Snapshot` is the current closeout-facing summary.
2. Use this playbook for command order, operator intent, and backlinks to the underlying evidence files.
3. Use `docs/ga-readiness-evidence.md` for the broader program-level GA signal matrix.

## 2. Published Package Surface Expectations

Published tarballs are expected to include:

1. `README.md` and `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` and `docs/local-adoption-playbook.zh-CN.md`
3. `docs/maintainer-validation-playbook.md` and `docs/maintainer-validation-playbook.zh-CN.md`
4. `docs/support-matrix.md` and `docs/support-matrix.zh-CN.md`
5. `examples/`
6. `integrations/ide/` and `integrations/desktop/`
7. `.codex/skills/`

Repo-local skills are shipped as reference assets only. They are not automatically copied into target repositories.
The support matrix ships with the tarball because the packaged surface must carry the same public support boundary it claims.
The real app workspaces under `apps/vscode-extension` and `apps/desktop` remain source-checkout validation surfaces; the published tarball can still carry internal `dist/**` build payloads, but it does not ship those app workspaces as standalone package-install roots.

## 3. Real-project Validation Runbook

Use this sequence when you want to validate the current interactive-shell delivery in one real target repository before widening rollout.

Current wrapper script:

```bash
TARGET_REPO=/absolute/path/to/real-target-repo \
bash "$GOVERNOR_REPO/scripts/acceptance/run-project-027-real-project-validation.sh"
```

Suggested environment:

```bash
export GOVERNOR_REPO=/absolute/path/to/repo-ai-governor
export TARGET_REPO=/absolute/path/to/real-target-repo
export CLI_BIN="$GOVERNOR_REPO/dist/bin/repo-ai-governor.js"
export ACCEPTANCE_HOME="$TARGET_REPO/.project-027-acceptance/home"
export REPO_LOCAL_ROOT="$TARGET_REPO/.repo-ai-governor"

cd "$GOVERNOR_REPO"
pnpm run build

cd "$TARGET_REPO"
```

Low-impact bootstrap rehearsal:

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json init
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json doctor
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json check
```

Workspace cutover and rollback rehearsal:

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action dry-run --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action execute --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action rollback --workspace-plan <plan-path> workspace
```

Interactive-shell rehearsal:

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react workflow preview --workflow-template condition-route
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react upgrade
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" resume
```

## 4. Example And Documentation Smoke

Run these from `<governor-repo>`:

```bash
pnpm run check:examples-doc-smoke
pnpm run check:examples-runtime-smoke
pnpm run check:examples-smoke
```

Use them to validate:

1. Root examples remain coherent.
2. Example docs still match runnable assets.
3. Runtime/example expectations do not drift silently.

### 4.1 VS Code Secondary Surface Validation

Use this runbook when refreshing the editor-native companion support boundary:

```bash
pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-064-vscode-extension-distribution-report.json
pnpm pack --json --dry-run
pnpm run check:ide-entry-smoke
pnpm run check:ide-docs-parity
pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md
```

Optional manual rehearsal:

```bash
code --extensionDevelopmentPath <governor-repo>/apps/vscode-extension <target-repo>
```

Notes:

1. Current formal support is limited to a built source checkout plus one extension-development host or one locally generated packaged extension root / VSIX from that same checkout.
2. `pnpm run release:verify-vscode-extension-distribution` is the dedicated packaging rehearsal; it validates the local VSIX archive shape plus packaged module-resolution smoke without claiming Marketplace or published installer support.
3. Use `pnpm pack --json --dry-run` to verify the published artifact still omits the extension workspace and published installable bundle even if internal `dist/apps/vscode-extension/**` payloads remain.
4. The published npm/tgz install surface and Marketplace remain unsupported for VS Code extension delivery.
5. There is still no dedicated automated extension-development-host launch smoke; the manual `code --extensionDevelopmentPath ...` rehearsal or `code --install-extension ...` step remains optional supporting evidence only.
6. `project-054` keeps desktop as a foundation-only surface; use this runbook to validate the VS Code companion path, not to widen desktop support claims.

### 4.2 Host-native Asset Validation

Use this runbook when refreshing the Codex / Claude Code host-native follow-up boundary:

```bash
pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
pnpm run release:verify-host-distribution -- --output .tmp/project-067-sprint-001-host-distribution-report.json
```

Notes:

1. This runbook validates only the built source-checkout host follow-up surface for Codex / Claude Code `project-local` export/apply plus plugin-bundle pack/verify.
2. Treat `host verify` as the contract recheck after every regenerated manifest. “Upgrade” for these assets means rerender plus verify after source or vendored-skill changes, not a standalone installer path.
3. Keep the public narrative aligned in `README*`, `docs/local-adoption-playbook*`, and `docs/support-matrix*` whenever the rendered asset shape, supported targets, or refresh contract changes.

### 4.3 Desktop Foundation-only Surface Validation

Use this runbook when refreshing the desktop secondary-surface decision without widening the public contract beyond the built-source foundation path:

```bash
pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-session-bridge.test.ts test/desktop-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1
pnpm run build
pnpm run check:desktop-entry-smoke
pnpm run release:verify-local -- --output .tmp/project-065-sprint-001-desktop-foundation-report.json
```

Notes:

1. `project-065` keeps desktop at a foundation-only support boundary: built governor source checkout plus local foundation verification. It does not create a standalone desktop installer, published desktop app bundle, or preferred-secondary-surface claim.
2. `pnpm run release:verify-local` is the maintainer truthfulness recheck for this boundary; it confirms the packaged CLI artifact still ships the desktop integration docs and still omits the `apps/desktop` workspace as a standalone package-install root.
3. The single public support declaration remains `docs/support-matrix.md`; keep `apps/desktop/README.md`, `integrations/desktop/README.md`, and `docs/local-adoption-playbook.md` aligned whenever the desktop narrative changes.

## 5. Clean-room And Release Verification

Run clean-room install verification from `<governor-repo>`:

```bash
pnpm run release:verify-cleanroom-local-install
```

Run broader maintainer gates from `<governor-repo>`:

```bash
pnpm run check
pnpm run release:verify-host-distribution
pnpm run release:verify-local
pnpm run release:ga-check
```

Notes:

1. `release:verify-cleanroom-local-install` validates packaged-install paths and can emit a machine-readable report with `--output <path>`.
2. Use `--modes tgz --iterations 1` when you are refreshing the online tarball-install support boundary instead of the older `path/link` baseline only.
3. `release:verify-local` includes local verification surfaces that are useful before rollout, including packed-surface truthfulness for shipped docs and reference assets.
4. `release:ga-check` is for maintainers deciding whether the current state is ready for broader release, not for ordinary adopters.
5. Current evidence backlinks expected by this playbook are `.tmp/project-052-sprint-001-cleanroom-report.json`, `.tmp/project-052-sprint-001-local-distribution-report.json`, `.tmp/project-052-sprint-002-command-rehearsal-summary.json`, `.tmp/project-055-sprint-001-pilot-1-rehearsal-summary.json`, `.tmp/project-055-sprint-001-pilot-2-rehearsal-summary.json`, `.tmp/project-063-sprint-001-cleanroom-tgz-report.json`, `.tmp/project-063-sprint-001-local-distribution-report.json`, `.tmp/project-065-sprint-001-desktop-foundation-report.json`, `.tmp/project-067-sprint-001-host-distribution-report.json`, and `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-002-ga-evidence-consolidation-and-closeout/tasks/DA-616-ga-evidence-dossier-and-cross-surface-backlinks.md`.
6. When those signals change, update `docs/support-matrix.md` first instead of creating a second status table in this playbook.

## 6. Interpreting External-adopter Warnings

Fresh external repositories may still show warnings such as:

1. `baseline_docs missing=5/5`
2. `script_not_found`

Interpretation:

1. For adopters, these are usually informational unless the target repository is intentionally vendoring this repository's own self-host governance stack.
2. For maintainers, they are still useful signals when checking whether user-facing docs explain the external-adopter baseline clearly enough.

## 7. Related References

1. `README.md`
2. `README.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
5. `docs/support-matrix.md`
6. `docs/ga-readiness-evidence.md`
7. `.tmp/project-052-sprint-001-cleanroom-report.json`
8. `.tmp/project-052-sprint-001-local-distribution-report.json`
9. `.tmp/project-052-sprint-002-command-rehearsal-summary.json`
10. `.tmp/project-055-sprint-001-pilot-1-rehearsal-summary.json`
11. `.tmp/project-055-sprint-001-pilot-2-rehearsal-summary.json`
12. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-002-ga-evidence-consolidation-and-closeout/tasks/DA-616-ga-evidence-dossier-and-cross-surface-backlinks.md`
