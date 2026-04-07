# Local Adoption Playbook

## 1. Scope

This playbook is for people adopting `repo-ai-governor` in a target repository. It focuses on how to install it, bootstrap it, connect AI tools, and run everyday governed flows without requiring knowledge of this repository's own self-host release process.

If you maintain or release `repo-ai-governor` itself, use `docs/maintainer-validation-playbook.md` instead.

## 2. Install Strategy Matrix

| Mode | Typical Use | Command |
|---|---|---|
| `path` | Fast local adoption | `pnpm add --save-exact <governor-repo>` |
| `link` | Source-linked development | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | Online packaged CLI-install rehearsal | `pnpm pack --json` + `pnpm add --save-exact <tarball>` |
| `dist-binary` | No-install CLI/runtime rehearsal for Yarn/npm or dirty repositories | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |

Choose the lightest path that matches your goal:

1. Start with `path` unless you have a reason not to.
2. Use `link` only when the target repo should follow local governor source changes.
3. Use `tgz` only when you want an online packaged CLI-install rehearsal and the environment can still reach the npm registry.
4. Use `dist-binary` when the target repo is dirty or non-`pnpm`, or when you want to validate CLI/runtime behavior before touching the target repo dependency graph.

The formal acceptance contract for these install modes lives in `docs/support-matrix.md`.

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

### 3.1 Optional VS Code Secondary Surface

Use this only when you want the editor-native companion on top of the normal CLI bootstrap path:

```bash
cd <governor-repo>
pnpm run build

code --extensionDevelopmentPath <governor-repo>/apps/vscode-extension <target-repo>
```

Boundary notes:

1. Current formal support is source-checkout only; build the governor repository before launching the extension-development host.
2. The published npm/tgz package surface does not include the `apps/vscode-extension` workspace or an installable extension bundle; internal `dist/apps/vscode-extension/**` payloads may still exist, but they are not a supported npm/VSIX/Marketplace distribution.
3. Trust-sensitive commands stay gated by `Workspace Trust`, so use a trusted workspace when validating review, HITL, recovery, or termination actions.
4. The current VS Code MVP is a service-backed companion for execution/review/HITL/context flows; it does not replace the normal CLI bootstrap path or the session shell.

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
5. `tool_transport_matrix` now projects effective transport truth; CLI-backed adapters such as `codex`, `claude-code`, and `github-copilot` show `cli_exec` even when config omits an explicit `transport`.
6. A `warn` or failed dry-run still counts as useful evidence when `report`, `replay`, and `diagnostics_trace` artifacts are emitted, because those artifacts preserve the failing stage and adapter attribution for follow-up routing fixes.
7. In the current validated `codex` baseline, `run --dry-run --trace` can complete the baseline `prepare -> execute -> report` chain through real `cli_exec` routing without performing governed file edits or dependency mutations; it still persists audit artifacts under the active governor workspace, so treat that as the preferred success signal before enabling a non-dry-run run.
8. `github-copilot` now follows the same CLI-backed truth model for tester-route verification, while `local-model` should still be read as a constrained fallback surface rather than a full substitute for required `tool_calling` or `structured_output` roles.

Helpful artifact paths:

1. Candidate config: `<workspace_root>/context/diagnostics/connect/<connect-id>.governor.yaml`
2. Candidate diagnostics: `<workspace_root>/context/diagnostics/connect/<connect-id>.json`
3. Verify diagnostics: `<workspace_root>/context/diagnostics/verify/`
4. Traced dry-run diagnostics: `<workspace_root>/context/diagnostics/run/` and `<workspace_root>/context/diagnostics/trace/`

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

Formal contract:

1. `dry-run` and `execute` require `--workspace-mode <repo_local|tool_managed>` and always hand off one saved `plan_path`.
2. `execute` writes the migrated plan plus `context/workspace/<migration-id>.execution.json`; failed execute flows persist `context/workspace/<migration-id>.failure.json` before retry.
3. `rollback` only consumes the saved `plan-path` and writes `context/workspace/<migration-id>.rollback.json`.
4. Re-run `doctor` after execute or rollback so you can confirm the active `workspaceRoot`.

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
pnpm exec repo-ai-governor upgrade apply <report-path> --confirm-upgrade approve --output json
pnpm exec repo-ai-governor upgrade rollback <apply-receipt-or-rollback-snapshot> --output json
```

Use these when you want to:

1. Preview or persist active workflow definitions.
2. Preview schema upgrades before changing `governor.yaml`.
3. Apply one reviewed upgrade report with explicit confirmation.
4. Roll back one applied upgrade from an apply receipt or rollback snapshot.
5. Use the React-shell surfaces for richer local TTY interaction.

Formal upgrade contract:

1. Preview writes `context/upgrade/<upgrade-id>.report.json`, `<upgrade-id>.auto-migrated-config.json`, and `<upgrade-id>.rollback-snapshot.yaml`.
2. Apply only consumes one preview `report_path` plus explicit `--confirm-upgrade approve`, and then writes one `*.apply-receipt.json` plus one verify receipt.
3. Rollback consumes one apply receipt or rollback snapshot and writes one `*.rollback-receipt.json` plus one verify receipt.
4. If preview reports blocking confirmation items, stop before apply and review them first.

Common artifacts:

1. Workflow definition: `<workspace_root>/context/workflow/active-workflow.definition.json`
2. Compiled IR snapshot: `<workspace_root>/context/compiled-ir/<execution_id>.json`
3. Upgrade report: `<workspace_root>/context/upgrade/<upgrade-id>.report.json`
4. Auto-migrated config preview: `<workspace_root>/context/upgrade/<upgrade-id>.auto-migrated-config.json`
5. Upgrade rollback snapshot: `<workspace_root>/context/upgrade/<upgrade-id>.rollback-snapshot.yaml`
6. Upgrade apply receipt: `<workspace_root>/context/upgrade/<apply-id>.apply-receipt.json`
7. Upgrade rollback receipt: `<workspace_root>/context/upgrade/<rollback-id>.rollback-receipt.json`

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
4. The `tgz` path validates the published CLI tarball surface plus shipped docs/reference assets only; it does not widen packaged VS Code, VSIX, Marketplace, or other secondary-surface support.
5. If a target repository already uses Yarn/npm or has a dirty worktree, start with `dist-binary`; otherwise start with `path` and move to `link` or `tgz` only when the workflow requires it.
5. Self-host warnings such as `baseline_docs missing=5/5` or `script_not_found` are expected in fresh external repos unless you intentionally vendor this repository's own governance stack.
6. If `upgrade` preview reports blocking confirmation items, stop before `apply`, review the saved `report_path` and `auto_migrated_config_path`, then rerun preview after fixing the configuration drift.
7. Keep both the preview `report_path` and either the `apply_receipt_path` or `rollback_snapshot_path`; supported rollback depends on those hand-off artifacts rather than manual path guessing.
8. After `workspace execute` or `workspace rollback`, rerun `doctor` to confirm the active `workspaceRoot` instead of inferring success from directory layout alone.
9. When rehearsing workspace migration, use a real target repository or an isolated external temp directory. Running the command from the governor source repository can reattach to that repo's Git root and create misleading workspace artifacts.
10. Keep the generated `*.rollback.json` or `*.rollback-receipt.json` artifacts in your acceptance window; they are the audit trail that proves the migration or upgrade closeout completed cleanly.

## 10. Optional Self-host Assets

1. Repository-local Codex helpers live under `.codex/skills/`; external adopters can ignore them unless they want the same self-host skill prompts and delivery workflows inside the target repository.
2. These assets are operational helpers for local AI tooling, not a requirement for the CLI install surfaces documented above.
3. `apps/vscode-extension` is an optional secondary surface for source-checkout evaluation, not part of the published package-install baseline.

## 11. Remote-api Rehearsal

Use this remote-api rehearsal only when you want to validate provider-backed behavior instead of the default local CLI-backed or fallback rehearsal:

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
pnpm run release:verify-local
```

Notes:

1. `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are only needed for remote-api rehearsal windows; normal local adoption can stay on default CLI-backed, fallback-only local-model, or dist-binary flows.
2. This rehearsal still assumes network access to the npm registry when your chosen install mode needs dependency resolution.

## 12. Next Steps

1. Use `docs/support-matrix.md` for current support boundaries.
2. Use `examples/` as starter assets for team adoption drills.
3. Use `CHANGELOG.md` for upgrade and migration notes.
4. Use `docs/maintainer-validation-playbook.md` only when you maintain or release `repo-ai-governor` itself.
