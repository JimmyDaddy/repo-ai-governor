# Repo AI Governor

Repository-local AI governance CLI for orchestrated workflows.

- Chinese guide: `README.zh-CN.md`
- Local adoption playbook: `docs/local-adoption-playbook.md`
- Formal support matrix: `docs/support-matrix.md`
- GA readiness evidence: `docs/ga-readiness-evidence.md`
- Repo-local skill references: `.codex/skills/`
- Examples assets: `examples/`
- Changelog: `CHANGELOG.md`

## 1. 5-15 Minute Quick Start

## 1.1 Prerequisites

1. Node.js `>=18`
2. `pnpm` for `path` / `link` / `tgz` package-based install modes
3. A target repository where you want to run governance flows

## 1.2 Local Install Options

Assume this repository root is `<governor-repo>` and target repository is `<target-repo>`.

### Option A: `path` (recommended for local iteration)

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
```

### Option B: `link` (recommended when frequently editing governor source)

```bash
cd <target-repo>
pnpm add --save-exact link:<governor-repo>
```

### Option C: `tgz` (release-candidate rehearsal; requires registry access)

```bash
cd <governor-repo>
pnpm pack --json

cd <target-repo>
pnpm add --save-exact /absolute/path/to/cjhdev-repo-ai-governor-<version>.tgz
```

### Option D: `dist` binary (no-install rehearsal for non-`pnpm` or dirty repositories)

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
```

Support boundary (validated on 2026-03-26):

1. `tgz` clean-room install is supported when `pnpm add` can reach the npm registry.
2. The tarball is not offline/self-contained: external dependencies such as `commander`, `i18next`, and `yaml` are still resolved during `pnpm add`.
3. For fully restricted or offline environments, use `path` or `link` with a pre-bootstrapped governor checkout.
4. For existing Yarn/npm repos or dirty worktrees where you do not want to mutate the dependency graph yet, use the `dist` binary rehearsal path first. This validates CLI behavior, not packaged install surface.

## 1.3 Packaged Reference Surface

Published tarballs are expected to include:

1. `README.md` and `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` and `docs/local-adoption-playbook.zh-CN.md`
3. `examples/`
4. `integrations/ide/` and `integrations/desktop/`
5. `.codex/skills/`

Repo-local skills under `.codex/skills/` are published as reference assets; they are not auto-copied into your target repository workspace.

## 1.4 Command Bootstrap Chain

Run this chain from `<target-repo>`.

Package-based install path:

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

For first-time setup with prompts, you can use:

```bash
pnpm exec repo-ai-governor init --output pretty
```

Interactive prompts are enabled by default in local TTY + `pretty` output. Use `--no-interactive` for CI/scripts.
In local TTY + `pretty` output, `repo-ai-governor` with no subcommand now opens the session-first shell on `stderr`; reattach with `pnpm exec repo-ai-governor resume [session-id]` when you want the latest or a specific persisted session.
The session shell accepts natural-language turns plus `/help`, `/resume`, `/clear`, `/theme`, `/agent`, `/history`, `/search`, `/multiline`, and `!<shell-command>` passthrough. You can also seed the first turn directly with `pnpm exec repo-ai-governor --output pretty "summarize this repository"`.
Command-scoped interactive surfaces such as `workflow` and `upgrade` continue to default to the React shell. Under `--no-interactive`, non-TTY, or `plain/json`, both shells still fall back to `none`, so CI and agent-style machine consumers keep the existing non-interactive contract.
Use `--ui-theme governor|catppuccin|calm` when you want a different React shell look for just one run without changing the stdout contract.
Theme precedence is `--ui-theme` override > workspace default > global CLI default.
Run `pnpm exec repo-ai-governor set-ui-theme --help` when you want to inspect the supported theme presets.
In interactive TTY + `pretty` mode, you can omit the preset to open a selector with `pnpm exec repo-ai-governor set-ui-theme --output pretty` or `pnpm exec repo-ai-governor workspace set-ui-theme --output pretty`.
To persist a different workspace default, run `pnpm exec repo-ai-governor workspace set-ui-theme calm --output json`.
To persist a global default shared by all workspaces, run `pnpm exec repo-ai-governor set-ui-theme calm --output json`.

If you are using `dist` binary rehearsal, replace `pnpm exec repo-ai-governor` with:

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

Expected baseline:

1. All commands return JSON with `status=success`.
2. `init` defaults to `tool_managed`, so fresh target repositories may not create `.repo-ai-governor/` immediately.
3. `doctor` returns attach mode via `command_result.attach_mode`; fresh external repos may also warn with `baseline_docs missing=5/5`.
4. `check` returns governance check summary in `command_result.check_totals`; non-self-host target repos may warn with governance `script_not_found`.
5. In local TTY + `pretty`, no-subcommand entry attaches to the session shell, while `resume [session-id]` can reattach the latest or a named persisted session.

## 1.5 Read-only Attach Precheck

Use `doctor` to detect whether current repository can run in write mode.

```bash
pnpm exec repo-ai-governor doctor --output json
```

When write access is unavailable, `doctor` should return `read_only` semantics instead of crashing.

## 1.6 Multi-tool Onboarding Baseline

Use this sequence when you want to wire Codex / Claude Code / GitHub Copilot style adapter roles into one repository-local baseline:

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

Notes:

1. `connect` does not mutate the active `governor.yaml`; it writes a candidate config artifact to `<workspace_root>/context/diagnostics/connect/<connect-id>.governor.yaml` and reports `candidate_config_path` / `candidate_config_valid` in JSON.
2. Available presets are `single-tool-minimal`, `multi-tool-default`, `single-tool-all-roles`, and `restricted-network-safe`. Use `--single-tool-all-roles <tool>` or repeated `--role-binding role=tool[,fallback]` when you need explicit routing overrides.
3. `doctor --adapters --fix` only applies safe-local repairs such as writable workspace/config/memory paths. Login, CLI install, proxy setup, and local-model download remain `nextAction`.
4. `verify --adapters` returns onboarding contract, role/tool matrix, and `agent_view`; `run --dry-run --trace` exercises projected descriptors and LangGraph supervisor diagnostics without requiring a real release run.

## 2. Full Governance Loop (Stage 9A/9B baseline)

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

This chain is expected to produce review verification and ledger-backfill artifacts under workspace context.

## 3. Workspace Mode And Rollback

Default mode is `tool_managed`. Switch to `repo_local` with the CLI migration path:

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

Persist a workspace default React shell theme when you do not want to pass `--ui-theme` every time:

```bash
pnpm exec repo-ai-governor workspace set-ui-theme calm --output json
```

Open the interactive selector instead of typing a preset:

```bash
pnpm exec repo-ai-governor workspace set-ui-theme --output pretty
pnpm exec repo-ai-governor set-ui-theme --output pretty
```

Persist a global React shell theme for all workspaces:

```bash
pnpm exec repo-ai-governor set-ui-theme calm --output json
```

Notes:

1. `init` alone keeps the repository on `tool_managed`; repo-local files appear only after `workspace execute`.
2. `workspace dry-run` writes the plan artifact under the current active workspace root; a successful `workspace execute` rewrites the plan and execution artifacts under the target workspace root.
3. `workspace rollback` writes the rollback artifact under the restored source workspace root and removes empty `.repo-ai-governor-migration/<migration-id>` scratch directories after a successful cleanup.
4. Theme precedence is command override `--ui-theme` > workspace default > global CLI default.
5. `workspace set-ui-theme <preset>` writes `ui.react.theme` into the active workspace config; when a repo-local selector config is also active, it is kept in sync only if that selector file already exists.
6. Top-level `set-ui-theme <preset>` defaults to global scope and writes `~/.repo-ai-governor/cli-preferences.yaml` without modifying workspace configs; use `--theme-scope workspace` if you intentionally want the shortcut to target only the current workspace.
7. `set-ui-theme --help` lists the supported presets, and interactive TTY + `pretty` mode lets you omit `[theme]` to open a selector.
8. Generated configs start with `ui.react.theme: governor`; keep `--ui-theme governor|catppuccin|calm` for one-off per-command overrides.
9. `workspace clear-config --output json` removes the current selector/config files for a clean debug reset without deleting other workspace artifacts.
10. The older `--workspace-action ...` form is still supported for scripts; the positional `workspace <action> [value]` form is the shorter human-facing shorthand.

### Workflow Definition Preview, Save, And Explicit Upgrade Shell

```bash
pnpm exec repo-ai-governor workflow preview --workflow-template loop-guarded --output json
pnpm exec repo-ai-governor workflow create --workflow-template condition-route --output json
pnpm exec repo-ai-governor workflow edit --output pretty
pnpm exec repo-ai-governor upgrade --output pretty
```

Notes:

1. `workflow preview` stays read-only and does not write workflow artifacts.
2. `workflow create` and `workflow edit` save the active workflow definition under `<workspace_root>/context/workflow/active-workflow.definition.json` and persist one compiled IR snapshot under `<workspace_root>/context/compiled-ir/<execution_id>.json`.
3. Loop nodes must carry both `maxCycles` and `maxWallTimeSeconds`, and condition-node branches must use non-empty unique `conditionKey` values before workflow persistence is accepted.
4. In local TTY + `pretty` mode, `workflow` and `upgrade` default to the React shell on `stderr`; add `--ui none` or `--ui classic` when you need to suppress it while preserving the existing stdout output contract.
5. React shell presets remain `governor|catppuccin|calm`; the persisted default comes from `ui.react.theme`, while `--ui-theme` is still a one-off override for the current command.

## 4. HITL Notification Providers

Real HITL notification delivery can be enabled with environment-backed providers:

```bash
export REPO_AI_GOVERNOR_NOTIFICATION_WEBHOOK_URL="https://example.com/webhook"
export REPO_AI_GOVERNOR_NOTIFICATION_CHAT_IM_URL="https://example.com/chat-im"
pnpm exec repo-ai-governor run --output json
```

Notes:

1. `REPO_AI_GOVERNOR_NOTIFICATION_WEBHOOK_URL` enables the primary webhook provider.
2. `REPO_AI_GOVERNOR_NOTIFICATION_CHAT_IM_URL` enables one backup `chat_im` provider for fallback rehearsal.
3. Optional per-channel knobs: `*_AUTH_TOKEN`, `*_HEADERS_JSON`, `*_TIMEOUT_MS`, `*_BACKOFF_BASE_MS`.
4. When no external notification provider is configured, CLI still records one local notification artifact fallback for deterministic rehearsal/debugging.

## 5. Examples And Validation Gates

Run the following scripts from `<governor-repo>` (repository maintenance scripts, not target-repo CLI commands):

- Examples root: `examples/`
- Doc smoke: `pnpm run check:examples-doc-smoke`
- Runtime smoke: `pnpm run check:examples-runtime-smoke`
- Aggregated smoke: `pnpm run check:examples-smoke`

For repository-wide validation, run:

```bash
pnpm run check
```

## 6. Troubleshooting Shortlist

1. `pnpm add <tarball>` fails with `ENOTFOUND` or registry-resolution errors: `tgz` install still requires npm registry access; use `path`/`link` or run in an online environment.
2. `ERR_MODULE_NOT_FOUND` after source-based adoption: run `pnpm install` at governor repository root and rebuild.
3. Fresh external repos may report `baseline_docs missing=5/5` in `doctor`: this is the current external-adopter baseline unless you explicitly vendor self-host governance docs into the target repo.
4. External target repos may report governance `script_not_found` warnings in `check`: this is expected unless that repo also carries the self-host governance scripts.
5. Existing Yarn/npm or dirty repositories: use the `dist` binary rehearsal path first if you want to validate behavior before mutating package-manager state.
6. Keep the printed `plan-path` from the most recent `workspace execute`; once the target workspace becomes active, that path is the canonical rollback reference.
7. After rollback, the rollback artifact follows the restored source workspace root; re-run `doctor` if you want to confirm the active workspace surface.
8. If `upgrade` warns on `confirmation_items`, inspect `upgrade_report` and `upgrade_auto_migrated_config`, keep `upgrade_rollback_snapshot`, and do not overwrite `governor.yaml` until those items are confirmed.
9. If `workspace execute` fails, inspect the reported failure-summary artifact before retrying; explicit rollback still uses the saved `plan-path`.

## 7. Next Steps

1. Follow `docs/local-adoption-playbook.md` for clean-room validation and upgrade paths.
2. Inspect `.codex/skills/` if you want repo-local skill templates for Codex-based workflows.
3. Use `examples/` scenarios to bootstrap team-level onboarding and rehearsal.
4. Track upgrades and migration notes in `CHANGELOG.md`.
5. See `docs/local-adoption-playbook.md` for the publish-safe Python/Go minimal governance pack entry.
6. See `docs/support-matrix.md` for the current formal support boundary and latest clean-room smoke snapshot.
7. See `docs/ga-readiness-evidence.md` for the current 11-signal GA readiness evidence snapshot and conditional items.
