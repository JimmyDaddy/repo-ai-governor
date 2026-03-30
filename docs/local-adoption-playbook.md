# Local Adoption Playbook

## 1. Scope

This playbook is for repository users who need to onboard, debug, and upgrade `repo-ai-governor` locally without waiting for npm release publication.

## 2. Install Strategy Matrix

| Mode | Typical Use | Command |
|---|---|---|
| `path` | Fast local iteration | `pnpm add --save-exact <governor-repo>` |
| `link` | Source-linked development | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | Candidate/GA rehearsal and reproducible package install | `pnpm pack --json` + `pnpm add --save-exact <tarball>` |
| `dist-binary` | No-install rehearsal for Yarn/npm or dirty repositories | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |

Operational baseline:

1. `path + link` remain the default local adoption paths.
2. `tgz` is supported for clean-room and release-candidate rehearsal when the install environment can reach the npm registry.
3. `tgz` is not offline/self-contained; external dependencies such as `commander`, `i18next`, and `yaml` are still resolved during `pnpm add`.
4. `dist-binary` is the preferred rehearsal path when you need to validate CLI behavior before mutating an existing Yarn/npm repository dependency graph.

## 2.1 Published Package Surface

Published tarballs are expected to include:

1. `README.md` and `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` and `docs/local-adoption-playbook.zh-CN.md`
3. `examples/`
4. `integrations/ide/` and `integrations/desktop/`
5. `.codex/skills/`

Repo-local skills under `.codex/skills/` are reference assets only. If you want Codex to discover them in a target repository, copy the selected skill into that target repository's `.codex/skills/` directory.

## 3. Bootstrap And Read-only Precheck

Run the baseline chain in target repo:

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

If you prefer guided setup for first-time adoption:

```bash
pnpm exec repo-ai-governor init --output pretty
```

Interactive prompts are enabled by default in local TTY + `pretty` output. Add `--no-interactive` for CI/scripted bootstrap.

If you are using `dist-binary` rehearsal, replace `pnpm exec repo-ai-governor` with:

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

When repository is non-writable, `doctor` should report read-only attach semantics.

Bootstrap notes from pilot validation:

1. `init` defaults to `tool_managed`, so fresh target repositories may not create `.repo-ai-governor/` immediately.
2. Fresh external repos may see `doctor` warning `baseline_docs missing=5/5`; treat this as current external-adopter baseline, not bootstrap failure.
3. External target repos may see `check` warnings such as `check-task-ledger-sync=script_not_found`; this is expected unless the target repo also vendors self-host governance scripts.

Session-first shell quick rehearsal:

```bash
pnpm exec repo-ai-governor --output pretty
pnpm exec repo-ai-governor --output pretty "summarize this repository"
pnpm exec repo-ai-governor resume --help
```

Quick expectations:

1. In local TTY + `pretty`, the no-subcommand entry should attach to the session shell on `stderr`.
2. Manual validation should cover `/help`, `/theme calm`, `/agent main`, `/history`, `/search <term>`, `/multiline`, `!pwd`, `/exit`, and then `resume [session-id]`.
3. `--no-interactive`, non-TTY, and `plain/json` must not enter the session shell.

## 3.1 Multi-tool Onboarding (Codex / Claude Code / GitHub Copilot)

Use a four-step path: tool readiness -> candidate config generation -> adapter diagnostics -> traced dry run.

1. First make sure each target AI tool can run independently in the target repository:
   - Codex CLI: `codex --help`
   - Claude Code CLI: `claude --help`
   - GitHub Copilot: confirm IDE chat is available; for CLI-heavy setups validate `gh auth status` first.
2. Generate one candidate adapters baseline:

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
```

Optional routing overrides:

```bash
pnpm exec repo-ai-governor connect \
  --tools codex,claude-code,github-copilot \
  --preset multi-tool-default \
  --role-binding planner=codex,claude-code \
  --role-binding reviewer=claude-code,codex \
  --output json
```

3. Inspect the generated candidate before applying it to your active config:
   - Candidate YAML: `<workspace_root>/context/diagnostics/connect/<connect-id>.governor.yaml`
   - Diagnostics JSON: `<workspace_root>/context/diagnostics/connect/<connect-id>.json`
   - `connect` does not rewrite the active `governor.yaml`; it produces a reviewable candidate artifact.
   - Use `--overwrite` when you want the candidate `adapters` block to fully replace the current one instead of merging on top.
   - Available presets are `single-tool-minimal`, `multi-tool-default`, `single-tool-all-roles`, and `restricted-network-safe`.
4. Run diagnostics and traced dry-run validation:

```bash
pnpm exec repo-ai-governor doctor --adapters --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

What to check:

1. `connect` JSON should expose `candidate_config_path`, `candidate_config_valid`, `selected_tools`, `onboardingContract`, and `agentView`.
2. If the current workspace still carries an incomplete local-model baseline, `connect` may report `candidateConfigValidationError`, but it should still emit the candidate artifact and diagnostics payload.
3. `doctor --adapters --fix` only performs safe-local repairs such as creating writable workspace/config/memory roots. Authentication, CLI install, proxy setup, and local-model download stay in `nextAction`.
4. `verify --adapters` emits onboarding contract, role/tool matrix, and `agentView`; a `fail` status should be treated as a hard block before real execution.
5. `run --dry-run --trace` should emit agent projection details plus one LangGraph supervisor artifact under `<workspace_root>/context/diagnostics/run/agent-supervisor/<execution_id>.json`.

## 3.2 Upgrade Analysis And Rollback Preparation

Run `upgrade` before writing any schema migration back into `governor.yaml`:

```bash
pnpm exec repo-ai-governor upgrade --output pretty
pnpm exec repo-ai-governor upgrade --output json
```

Interpret the output as follows:

1. `upgrade_report` is the authoritative schema diff artifact; it contains diff summary, migration suggestions, and confirmation items.
2. `upgrade_auto_migrated_config` is an analyze-only candidate config; compare it with the current file before replacing `governor.yaml`.
3. `upgrade_rollback_snapshot` is the canonical rollback source; keep it together with the config change you are reviewing.
4. If output shows `confirmation_items` warnings or a non-zero blocking count, stop and manually confirm those items before writing any migrated config back.
5. Keep the printed rollback reference until the upgraded config survives one `doctor` + `check` round in the target repository.
6. In local TTY + `pretty` mode, `upgrade` defaults to the React shell on `stderr`; use `--ui none` or `--ui classic` when you need a quieter human-facing run while keeping stdout machine-readable.
7. Use `--ui-theme governor|catppuccin|calm` to switch the React shell preset during local validation runs.

## 3.3 Workflow Definition Preview And Save

Use the workflow surface to preview built-in topologies, then persist one validated active definition:

```bash
pnpm exec repo-ai-governor workflow preview --workflow-template loop-guarded --output json
pnpm exec repo-ai-governor workflow create --workflow-template condition-route --output json
pnpm exec repo-ai-governor workflow edit --output pretty
```

Interpret the output as follows:

1. `workflow preview` is read-only and does not write workflow artifacts.
2. `workflow create` and `workflow edit` persist the active workflow definition to `<workspace_root>/context/workflow/active-workflow.definition.json`.
3. Successful create/edit runs also persist one compiler-accepted snapshot to `<workspace_root>/context/compiled-ir/<execution_id>.json`.
4. Loop nodes must declare both `maxCycles` and `maxWallTimeSeconds`; condition-node branches must use non-empty unique `conditionKey` values or persistence is blocked.
5. `workflow edit` loads the saved workspace definition when present; pass `--workflow-template` if you intentionally want to reseed the active definition from a built-in starter topology.

## 4. Workspace Mode Switch And Rollback

Default mode is `tool_managed`.

Switch to `repo_local` with explicit migration commands:

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

Rollback plan:

1. Keep the printed `plan-path` from `workspace dry-run` or `workspace execute`.
2. Use that same `plan-path` for explicit rollback.
3. Re-run `doctor` and verify `workspaceRoot` resolves back to `tool_managed`.

Persist a workspace default React shell theme when you do not want to repeat `--ui-theme` on every run:

```bash
pnpm exec repo-ai-governor workspace set-ui-theme calm --output json
```

Open the interactive selector when you prefer choosing from the available presets:

```bash
pnpm exec repo-ai-governor workspace set-ui-theme --output pretty
pnpm exec repo-ai-governor set-ui-theme --output pretty
```

Persist a global default React shell theme shared by every workspace:

```bash
pnpm exec repo-ai-governor set-ui-theme calm --output json
```

Theme and reset notes:

1. Theme precedence is command override `--ui-theme` > workspace default > global CLI default.
2. `set-ui-theme` writes `ui.react.theme` into the active `governor.yaml` by default; generated configs start with `ui.react.theme: governor`.
3. If a repo-local selector config is also active, workspace-scoped `set-ui-theme` keeps that file in sync only when the selector file already exists.
4. Top-level `set-ui-theme <preset>` defaults to global scope, writes `~/.repo-ai-governor/cli-preferences.yaml`, and does not modify workspace configs; use `--theme-scope workspace` only when you intentionally want the shortcut to target the current workspace.
5. `pnpm exec repo-ai-governor set-ui-theme --help` lists the supported presets, and interactive TTY + `pretty` mode lets you omit `[theme]` to open a selector.
6. Keep using `--ui-theme governor|catppuccin|calm` when you want a one-off shell override during validation.
7. Use `pnpm exec repo-ai-governor workspace clear-config --output json` when you want to remove the current selector/config files without deleting workflow, diagnostics, or review artifacts.
8. The legacy `--workspace-action ...` form still works; prefer `workspace <action> [value]` for shorter human-driven commands.

Artifact locality contract:

1. `workspace dry-run` writes the plan artifact under the current active workspace root.
2. A successful `workspace execute` rewrites the plan and execution artifacts under the target workspace root.
3. `workspace rollback` writes the rollback artifact under the restored source workspace root and removes empty `.repo-ai-governor-migration/<migration-id>` scratch directories after cleanup.
4. If `workspace execute` fails, inspect the failure-summary artifact path returned in stderr or JSON `error_details.report_path` before retrying.
5. If rollback completes with `workspace_scratch_cleanup` warning, inspect the retained scratch root and clean it up manually only after confirming rollback state is stable.

## 4.1 Real-project Validation Runbook

Use this sequence when you want to validate the current interactive-shell delivery in one real target repository before adopting it more broadly. The automation wrapper still covers the command-scoped React shell baseline from `project-027`; session-first shell checks from `project-029` remain part of the same manual rehearsal window.

Automation wrapper:

```bash
TARGET_REPO=/absolute/path/to/real-target-repo \
bash "$GOVERNOR_REPO/scripts/acceptance/run-project-027-real-project-validation.sh"
```

Recommended approach:

1. Build the governor repository first, then rehearse with the `dist` binary before changing package dependencies in the target repository.
2. Start with a low-impact bootstrap pass under an isolated `tool_managed` sandbox by overriding `HOME` inside the validation wrapper.
3. Switch to `repo_local` only when you are ready to inspect persisted artifacts and explicit rollback references.
4. Validate React-shell behavior in a real TTY, but re-check the same surfaces in `json` or `--no-interactive` mode to confirm the stdout contract stays stable.

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

Notes:

1. Fresh external repositories may report `baseline_docs missing=5/5` or `script_not_found` warnings; treat those as external-adopter baseline signals unless the target repository is expected to vendor self-host governance scripts.
2. This first pass is meant to confirm command stability and machine-readable output, not to prove that the target repository already satisfies every self-host governance gate.

Workspace cutover and rollback rehearsal:

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action dry-run --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action execute --workspace-mode repo_local --workspace-root "$REPO_LOCAL_ROOT" workspace
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json --workspace-action rollback --workspace-plan <plan-path> workspace
```

Workflow and upgrade validation:

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json workflow preview --workflow-template loop-guarded
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json workflow create --workflow-template condition-route
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json workflow edit
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json upgrade
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output json connect
```

React-shell manual checks in a real TTY:

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react workflow preview --workflow-template condition-route > workflow-preview.stdout.txt
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react workflow create --workflow-template condition-route > workflow-create.stdout.txt
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react upgrade > upgrade.stdout.txt
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react connect > connect.stdout.txt
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty --ui react --no-interactive workflow preview --workflow-template parallel-review > workflow-preview.no-interactive.stdout.txt
```

Session-shell manual checks in a real TTY:

```bash
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" --output pretty "summarize the repository layout"
HOME="$ACCEPTANCE_HOME" node "$CLI_BIN" resume
```

Expected observations:

1. React shell text appears in the terminal on `stderr`, not in the redirected stdout files.
2. `workflow preview` stays read-only and does not create workflow definition or compiled IR artifacts.
3. `workflow create` and `workflow edit` persist:
   - `<workspace_root>/context/workflow/active-workflow.definition.json`
   - `<workspace_root>/context/compiled-ir/<execution_id>.json`
4. `upgrade` persists:
   - `context/upgrade/<upgrade_id>.report.json`
   - `context/upgrade/<upgrade_id>.auto-migrated-config.json`
   - `context/upgrade/<upgrade_id>.rollback-snapshot.yaml`
5. In local TTY + `pretty` mode, `upgrade` defaults to the React shell; `--ui none` and `--ui classic` remain the suppression path.
6. The `--no-interactive` command falls back without rendering React shell.
7. In local TTY + `pretty`, the no-subcommand entry attaches to the session shell, the quoted startup prompt is sent as the first turn, and `resume` can reattach the latest persisted session.
8. Session-shell manual checks should confirm slash discoverability (`/help`), foreground route/theme introspection (`/agent`, `/theme`), history/search recall, multi-line capture, and `!` passthrough without polluting redirected stdout.
9. Session-shell manual checks should also confirm live Ink input behavior: typing `/` opens the palette immediately, `Up/Down` changes the highlight, `Tab` completes the highlighted command, `Esc` closes the palette, `Ctrl+L` clears only the local live surface, and paste / CJK input stay intact in the composer.

Treat the run as passed when all of the following are true:

1. The `dist` binary runs successfully in the real target repository.
2. React shell rendering is visible only on `stderr`.
3. `json` and `--no-interactive` flows preserve the existing stdout contract.
4. `workspace` plan / execution / rollback artifacts are all traceable.
5. `workflow create/edit` persist definition and compiled IR, while `workflow preview` remains read-only.
6. `upgrade` emits all three upgrade artifacts whether the React shell is reached by default or explicitly requested.
7. Session-shell entry, quoted startup prompts, and `resume` all behave consistently in a real TTY while keeping `json` and `--no-interactive` untouched.
8. Live slash palette and keyboard affordances (`/`, `Up/Down`, `Tab`, `Esc`, `Ctrl+L`) behave the same way in the real TTY smoke path.

## 5. Local Debug Path

### 5.1 Dry-run and Trace

```bash
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

### 5.2 Replay

```bash
pnpm exec repo-ai-governor run --output json --replay <replay-file-path>
```

Use replay for deterministic diagnosis when runtime outputs already exist.

## 6. Review-verify And Ledger Backfill

Run end-to-end collaboration path:

```bash
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

Expected artifact paths are under workspace context:

1. `context/review-queue/requests`
2. `context/review-queue/results`
3. `context/ledger-backfill/review-verify`

These artifacts are required for Stage 9B rehearsal where review verification and task-ledger backfill should be auditable.

## 7. Examples Mapping

Use root examples as the canonical rehearsal assets:

1. `examples/single-role-minimal-flow`
2. `examples/multi-role-collaboration-flow`
3. `examples/hitl-escalation-flow`
4. `examples/restricted-network-degrade-flow`

Validation commands:
Run from `<governor-repo>`:

```bash
pnpm run check:examples-doc-smoke
pnpm run check:examples-runtime-smoke
pnpm run check:examples-smoke
```

## 7.1 Minimal Language Pack Baseline

The published package currently exposes two built-in minimal governance packs through `@repo-ai-governor/standards`:

1. `pythonMinimalGovernancePack`
   - baseline focus: `pyproject.toml`, `ruff format/check`, `pytest`, `pyright`
2. `goMinimalGovernancePack`
   - baseline focus: `go.mod/go.sum`, `go fmt ./...`, `go test ./...`, `go vet ./...`

Use them as the official baseline layer, then add team or repository overrides on top:

```ts
import {
  StandardsPackRegistry,
  goMinimalGovernancePack,
  pythonMinimalGovernancePack,
} from "@repo-ai-governor/standards";

const registry = new StandardsPackRegistry({
  packs: [pythonMinimalGovernancePack, goMinimalGovernancePack],
});
```

Notes:

1. This path is publish-safe because the root package already ships `docs/` and `dist/`.
2. Treat these packs as minimal productized baselines rather than complete language best-practice bundles.

## 8. Clean-room Verification And Differences

Run clean-room verification baseline from governor repository:

```bash
pnpm run release:verify-cleanroom-local-install
```

Notes:

1. Stage 9A baseline enforces repeated path/link validation.
2. Stage 9B+ baseline includes `tgz` install smoke to verify packaged runtime dependency resolution.
3. `tgz` validation is an online check, not proof of offline/self-contained installation.

## 9. Governance Gates For Adoption

For full local delivery confidence:
Run from `<governor-repo>`:

```bash
pnpm run check
pnpm run release:verify-local
pnpm run release:ga-check
```

## 10. Upgrade Checklist

1. Read `CHANGELOG.md` for migration notes.
2. Re-run baseline bootstrap chain in one fresh target repo.
3. Re-run examples smoke gates.
4. Re-run clean-room verification before broader rollout.

## 11. Known Limitations

1. `dist-binary` validates CLI/runtime behavior but does not prove packaged install surface.
2. `doctor` / `check` still emit external-baseline warnings in fresh target repos until self-host governance docs/scripts are explicitly vendored there.
