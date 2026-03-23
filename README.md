# Repo AI Governor

Repository-local AI governance CLI for orchestrated workflows.

- Chinese guide: `README.zh-CN.md`
- Local adoption playbook: `docs/local-adoption-playbook.md`
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

### Option C: `tgz` (Stage 9B follow-up, currently a known limitation)

```bash
cd <governor-repo>
pnpm pack --json

cd <target-repo>
pnpm add --save-exact /absolute/path/to/cjhdev-repo-ai-governor-<version>.tgz
```

Known limitation (validated on 2026-03-22):
`tgz` mode still fails at `pnpm exec repo-ai-governor --help` with
`ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)` in clean-room validation.
Use `path` or `link` for Stage 9A onboarding, and treat `tgz` as a Stage 9B fix-forward item.

## 1.3 Command Bootstrap Chain

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

## 1.4 Read-only Attach Precheck

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

1. `ERR_MODULE_NOT_FOUND`: run `pnpm install` at governor repository root and rebuild.
2. Runtime smoke fails on output parsing: force `--output json` in all automation calls.
3. `review-verify` reports no queued request: run `review` once before `review-verify`.
4. Unexpected workspace root: check `governor.yaml.workspace.mode` and current working directory.

## 6. Next Steps

1. Follow `docs/local-adoption-playbook.md` for clean-room validation and upgrade paths.
2. Use `examples/` scenarios to bootstrap team-level onboarding and rehearsal.
3. Track upgrades and migration notes in `CHANGELOG.md`.
