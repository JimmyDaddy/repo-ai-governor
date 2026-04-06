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
4. `examples/`
5. `integrations/ide/` and `integrations/desktop/`
6. `.codex/skills/`

Repo-local skills are shipped as reference assets only. They are not automatically copied into target repositories.

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

## 5. Clean-room And Release Verification

Run clean-room install verification from `<governor-repo>`:

```bash
pnpm run release:verify-cleanroom-local-install
```

Run broader maintainer gates from `<governor-repo>`:

```bash
pnpm run check
pnpm run release:verify-local
pnpm run release:ga-check
```

Notes:

1. `release:verify-cleanroom-local-install` validates packaged-install paths and can emit a machine-readable report with `--output <path>`.
2. `release:verify-local` includes local verification surfaces that are useful before rollout.
3. `release:ga-check` is for maintainers deciding whether the current state is ready for broader release, not for ordinary adopters.
4. Current `project-052` evidence backlinks expected by this playbook are `.tmp/project-052-sprint-001-cleanroom-report.json`, `.tmp/project-052-sprint-001-local-distribution-report.json`, and `.tmp/project-052-sprint-002-command-rehearsal-summary.json`.
5. When those signals change, update `docs/support-matrix.md` first instead of creating a second status table in this playbook.

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
