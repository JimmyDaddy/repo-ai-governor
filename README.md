# Repo AI Governor

Repository-local AI governance CLI for orchestrated workflows.

- Chinese guide: `README.zh-CN.md`
- Local adoption playbook: `docs/local-adoption-playbook.md`
- Repo-local skill references: `.codex/skills/`
- Examples assets: `examples/`
- Changelog: `CHANGELOG.md`

## 1. 5-15 Minute Quick Start

## 1.1 Prerequisites

1. Node.js `>=18`
2. `pnpm`
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

Support boundary (validated on 2026-03-26):

1. `tgz` clean-room install is supported when `pnpm add` can reach the npm registry.
2. The tarball is not offline/self-contained: external dependencies such as `commander`, `i18next`, and `yaml` are still resolved during `pnpm add`.
3. For fully restricted or offline environments, use `path` or `link` with a pre-bootstrapped governor checkout.

## 1.3 Packaged Reference Surface

Published tarballs are expected to include:

1. `README.md` and `README.zh-CN.md`
2. `docs/local-adoption-playbook.md` and `docs/local-adoption-playbook.zh-CN.md`
3. `examples/`
4. `integrations/ide/` and `integrations/desktop/`
5. `.codex/skills/`

Repo-local skills under `.codex/skills/` are published as reference assets; they are not auto-copied into your target repository workspace.

## 1.4 Command Bootstrap Chain

Run this chain from `<target-repo>`:

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

Expected baseline:

1. All commands return JSON with `status=success`.
2. `doctor` returns attach mode via `command_result.attach_mode`.
3. `check` returns governance check summary in `command_result.check_totals`.

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

Default mode is `tool_managed`. You can switch to `repo_local` in `.repo-ai-governor/governor.yaml`:

```yaml
schemaVersion: "1.1"
workspace:
  mode: repo_local
  migrationPolicy: copy_verify_switch_rollback
```

To rollback, set `workspace.mode` back to `tool_managed` and rerun `init` then `doctor`.

## 4. Examples And Validation Gates

Run the following scripts from `<governor-repo>` (repository maintenance scripts, not target-repo CLI commands):

- Examples root: `examples/`
- Doc smoke: `pnpm run check:examples-doc-smoke`
- Runtime smoke: `pnpm run check:examples-runtime-smoke`
- Aggregated smoke: `pnpm run check:examples-smoke`

For repository-wide validation, run:

```bash
pnpm run check
```

## 5. Troubleshooting Shortlist

1. `pnpm add <tarball>` fails with `ENOTFOUND` or registry-resolution errors: `tgz` install still requires npm registry access; use `path`/`link` or run in an online environment.
2. `ERR_MODULE_NOT_FOUND` after source-based adoption: run `pnpm install` at governor repository root and rebuild.
3. Runtime smoke fails on output parsing: force `--output json` in all automation calls.
4. `review-verify` reports no queued request: run `review` once before `review-verify`.
5. Unexpected workspace root: check `governor.yaml.workspace.mode` and current working directory.

## 6. Next Steps

1. Follow `docs/local-adoption-playbook.md` for clean-room validation and upgrade paths.
2. Inspect `.codex/skills/` if you want repo-local skill templates for Codex-based workflows.
3. Use `examples/` scenarios to bootstrap team-level onboarding and rehearsal.
4. Track upgrades and migration notes in `CHANGELOG.md`.
