# Local Adoption Playbook

## 1. Scope

This playbook is for people adopting `repo-ai-governor` in a target repository. It focuses on how to install it, bootstrap it, connect AI tools, and run everyday governed flows without requiring knowledge of this repository's own self-host release process.

If you maintain or release `repo-ai-governor` itself, use `docs/maintainer-validation-playbook.md` instead.

## 2. Install Strategy Matrix

| Mode | Typical Use | Command |
|---|---|---|
| `path` | Fast local adoption | `pnpm add --save-exact <governor-repo>` |
| `link` | Source-linked development | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | Packaged-install rehearsal | `pnpm pack --json` + `pnpm add --save-exact <tarball>` |
| `dist-binary` | No-install rehearsal for Yarn/npm or dirty repositories | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |

Choose the lightest path that matches your goal:

1. Start with `path` unless you have a reason not to.
2. Use `link` when you actively edit governor source.
3. Use `tgz` when you want to rehearse a packaged install.
4. Use `dist-binary` when you want to validate behavior before touching the target repo dependency graph.

## 3. Bootstrap A Target Repository

Run this baseline chain from the target repository:

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

If you are using the `dist-binary` path, replace `pnpm exec repo-ai-governor` with:

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

What success looks like:

1. `init --output pretty` completes one guided setup path.
2. `doctor` reports attach/write-mode facts instead of crashing.
3. `check` returns machine-readable totals, even when the target repo is not a self-host copy of this repository.

External-adopter notes:

1. Fresh target repositories may still show `baseline_docs missing=5/5` or `script_not_found` warnings.
2. Treat those warnings as informational unless your target repository is intentionally vendoring this repository's own governance docs and scripts.
3. `init` defaults to `tool_managed`, so a fresh target repo may not create `.repo-ai-governor/` immediately.

## 4. Session Shell Quick Tour

Use the session shell when you want a conversation-first entrypoint instead of a one-shot subcommand.

```bash
pnpm exec repo-ai-governor --output pretty
pnpm exec repo-ai-governor --output pretty "summarize this repository"
pnpm exec repo-ai-governor resume [session-id]
```

Quick checks:

1. In local TTY + `pretty`, the no-subcommand entry should attach to the session shell on `stderr`.
2. `/help`, `/history`, `/search <term>`, `/multiline`, and `!<shell-command>` should be available from the shell.
3. `resume` should reattach the latest or named persisted session.
4. `--no-interactive`, non-TTY, `plain`, and `json` should not enter the interactive shell.

## 5. Multi-tool Onboarding

Use this path when you want to wire Codex, Claude Code, or GitHub Copilot style adapters into one repository baseline:

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

What to pay attention to:

1. `connect` writes a reviewable candidate config instead of mutating the active `governor.yaml` in place.
2. `doctor --adapters --fix` performs safe-local repairs only; authentication and tool installation remain follow-up actions.
3. `verify --adapters` should be treated as the readiness decision before real execution.
4. `run --dry-run --trace` is the safest way to validate routing and projected descriptors before a real run.

Helpful artifact paths:

1. Candidate config: `<workspace_root>/context/diagnostics/connect/<connect-id>.governor.yaml`
2. Candidate diagnostics: `<workspace_root>/context/diagnostics/connect/<connect-id>.json`
3. Traced dry-run diagnostics: `<workspace_root>/context/diagnostics/run/`

## 6. First Governed Flow

Use this sequence when you want the full plan -> run -> review -> verify path:

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

Expected outputs are stored under the active workspace root. Common locations include:

1. `context/review-queue/requests`
2. `context/review-queue/results`
3. `context/ledger-backfill/review-verify`

When the active workspace exposes canonical sprint `tasks/`, the review chain also allocates a `CR-xxx` task card and keeps that card synchronized with the review lifecycle status.

## 7. Workspace Mode And Rollback

Default mode is `tool_managed`. Switch to `repo_local` only when you want the governance workspace persisted inside the target repository.

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

Recommended habits:

1. Keep the printed `plan-path` from `workspace dry-run` or `workspace execute`.
2. Re-run `doctor` after migration or rollback so you can confirm the active `workspaceRoot`.
3. If migration fails, inspect the reported failure-summary artifact before retrying.

## 8. Advanced User Capabilities

### 8.1 Workflow And Upgrade Surfaces

```bash
pnpm exec repo-ai-governor workflow preview --workflow-template loop-guarded --output json
pnpm exec repo-ai-governor workflow create --workflow-template condition-route --output json
pnpm exec repo-ai-governor workflow edit --output pretty
pnpm exec repo-ai-governor upgrade --output pretty
pnpm exec repo-ai-governor upgrade --output json
```

Use these when you want to:

1. Preview or persist active workflow definitions.
2. Inspect schema upgrades before changing `governor.yaml`.
3. Use the React-shell surfaces for richer local TTY interaction.

Common artifacts:

1. Workflow definition: `<workspace_root>/context/workflow/active-workflow.definition.json`
2. Compiled IR snapshot: `<workspace_root>/context/compiled-ir/<execution_id>.json`
3. Upgrade report: `<workspace_root>/context/upgrade/`

### 8.2 HITL Notification Providers

You can enable webhook-style HITL notifications with environment variables:

```bash
export REPO_AI_GOVERNOR_NOTIFICATION_WEBHOOK_URL="https://example.com/webhook"
export REPO_AI_GOVERNOR_NOTIFICATION_CHAT_IM_URL="https://example.com/chat-im"
pnpm exec repo-ai-governor run --output json
```

### 8.3 Built-in Governance Packs

The published package exposes three built-in governance packs through `@repo-ai-governor/standards`:

1. `workflowReviewGovernancePack`
2. `pythonMinimalGovernancePack`
3. `goMinimalGovernancePack`

Use `workflowReviewGovernancePack` when you want the adopter-facing governance flow itself to allocate standalone `CR-xxx` review task cards and keep the `review_pending -> verified -> resolved` lifecycle synchronized.

Then layer the language pack you need, plus any team or repository overrides, on top.

## 9. Troubleshooting And Known Limitations

1. `pnpm add <tarball>` failing with `ENOTFOUND` usually means the install environment cannot reach the npm registry; use `path`, `link`, or `dist-binary` instead.
2. `dist-binary` validates CLI/runtime behavior, not packaged-install behavior.
3. `tgz` is not offline/self-contained; installation still resolves external dependencies.
4. If a target repository already uses Yarn/npm or has a dirty worktree, start with `dist-binary` before switching to package installation.
5. Self-host warnings such as `baseline_docs missing=5/5` or `script_not_found` are expected in fresh external repos unless you intentionally vendor this repository's own governance stack.

## 10. Optional Self-host Assets

1. Repository-local Codex helpers live under `.codex/skills/`; external adopters can ignore them unless they want the same self-host skill prompts and delivery workflows inside the target repository.
2. These assets are operational helpers for local AI tooling, not a requirement for the CLI install surfaces documented above.

## 11. Remote-api Rehearsal

Use this remote-api rehearsal only when you want to validate provider-backed behavior instead of fixture-backed local smoke:

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
pnpm run release:verify-local
```

Notes:

1. `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are only needed for remote-api rehearsal windows; normal local adoption can stay on fixture-backed and dist-binary flows.
2. This rehearsal still assumes network access to the npm registry when your chosen install mode needs dependency resolution.

## 12. Next Steps

1. Use `docs/support-matrix.md` for current support boundaries.
2. Use `examples/` as starter assets for team adoption drills.
3. Use `CHANGELOG.md` for upgrade and migration notes.
4. Use `docs/maintainer-validation-playbook.md` only when you maintain or release `repo-ai-governor` itself.
