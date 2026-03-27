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

If you are using `dist` binary rehearsal, replace `pnpm exec repo-ai-governor` with:

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js <command>
```

Expected baseline:

1. All commands return JSON with `status=success`.
2. `init` defaults to `tool_managed`, so fresh target repositories may not create `.repo-ai-governor/` immediately.
3. `doctor` returns attach mode via `command_result.attach_mode`; fresh external repos may also warn with `baseline_docs missing=5/5`.
4. `check` returns governance check summary in `command_result.check_totals`; non-self-host target repos may warn with governance `script_not_found`.

## 1.5 Read-only Attach Precheck

Use `doctor` to detect whether current repository can run in write mode.

```bash
pnpm exec repo-ai-governor doctor --output json
```

When write access is unavailable, `doctor` should return `read_only` semantics instead of crashing.

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
pnpm exec repo-ai-governor workspace --workspace-action dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace --workspace-action execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace --workspace-action rollback --workspace-plan <plan-path> --output json
```

Notes:

1. `init` alone keeps the repository on `tool_managed`; repo-local files appear only after `workspace execute`.
2. `workspace dry-run` writes the plan artifact under the current active workspace root; a successful `workspace execute` rewrites the plan and execution artifacts under the target workspace root.
3. `workspace rollback` writes the rollback artifact under the restored source workspace root and removes empty `.repo-ai-governor-migration/<migration-id>` scratch directories after a successful cleanup.

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
