# Repo AI Governor Support Matrix

- Status: active
- Last updated: 2026-04-04
- Scope: formal support declaration refreshed by `project-026 / sprint-004` (`TK-301`) and `project-044 / sprint-003` (`TK-547`)

## 1. Installation Modes

| Mode | Status | Notes |
|---|---|---|
| `path` (`pnpm add <repo>`) | Supported | Default local adoption path for iterative development. |
| `link` (`pnpm add link:<repo>`) | Supported | Recommended for frequent source-level debugging. |
| `dist` binary (`node dist/bin/repo-ai-governor.js`) | Supported | Preferred no-install rehearsal path for dirty or non-`pnpm` repositories. |
| `tgz` (`pnpm pack` + `pnpm add <tarball>`) | Supported (online) | Requires registry/network reachability for runtime dependencies. |

## 2. Adapter Surfaces

| Adapter surface | Status | Notes |
|---|---|---|
| `codex` | Fixture-backed | Primary route in current verification baseline. |
| `github-copilot` | Fixture-backed (conditional) | This smoke snapshot reported quota-based health warning; runtime fell back to `codex`. |
| `claude-code` | Fixture-backed (conditional) | This smoke snapshot reported probe warning; runtime remained available through fallback routing. |

## 3. Language Governance Templates

| Language | Status | Notes |
|---|---|---|
| TypeScript | Built-in | Full governance chain in repository baseline. |
| Python | Minimal baseline | `pythonMinimalGovernancePack` is published via `@repo-ai-governor/standards`. |
| Go | Minimal baseline | `goMinimalGovernancePack` is published via `@repo-ai-governor/standards`. |

## 4. Runtime Baseline

| Item | Requirement / validated value |
|---|---|
| Node.js | Minimum `>=18` (engine contract); validated snapshot `v22.22.0` |
| pnpm | Package manager baseline; validated snapshot `10.30.3` |
| OS surface | macOS / Linux / WSL2 |

## 5. IDE / Execution Surface

| Surface | Status | Notes |
|---|---|---|
| CLI | Supported | Primary production entry. |
| Desktop sidecar entry | Supported for smoke baseline | `apps/desktop` is now the formal desktop foundation package; `check-desktop-entry-smoke` and `release:verify-local` are green while full desktop product surface remains staged evolution. |

## 6. Clean-room Smoke Snapshot (TK-301 + TK-547)

| Time (UTC) | Command | Result | Evidence |
|---|---|---|---|
| 2026-04-04T12:09:14Z | `pnpm run build` | Pass | `dist/apps/desktop` and `dist/node_modules/@repo-ai-governor/desktop` materialized for local distribution validation |
| 2026-04-04T12:09:14Z | `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` | Pass | `118` files and `734` tests passed |
| 2026-04-04T12:09:14Z | `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` | Pass | `19` files and `47` tests passed |
| 2026-04-04T12:12:23Z | `pnpm run release:verify-local` | Pass | CLI help smoke + desktop entry smoke + examples runtime smoke + dist-binary remote-api smoke + packed-surface truthfulness all passed |
| 2026-03-27T22:38:31Z | `node ./dist/bin/repo-ai-governor.js doctor --output pretty` | Pass | `attach_mode=read_write`, `operation=env_doctor` |
| 2026-03-27T22:38:38Z | `node ./dist/bin/repo-ai-governor.js verify --output pretty --adapters` | Warn (non-blocking) | `adapters_status=warn`, required role failures `0` |
| 2026-03-27T22:39:17Z | `node ./dist/bin/repo-ai-governor.js workspace --workspace-action dry-run --workspace-mode repo_local --output pretty` | Pass | workspace plan emitted under active workspace root |
| 2026-03-27T22:39:21Z | `node ./scripts/release/verify-local-distribution.js` | Pass | local distribution verified, `pack_file=cjhdev-repo-ai-governor-0.1.5.tgz` |
| 2026-03-27T22:39:31Z | `node ./scripts/examples/check-desktop-entry-smoke.js` | Pass | desktop sidecar runtime smoke passed for default distribution mode |

## 7. Notes

1. The adapter warning in this snapshot is environment-precondition related (`github-copilot` quota/probe path) rather than governance chain failure.
2. `project-044` refreshes the desktop smoke baseline into a formal `apps/desktop` package, but the `artifact pane` remains intentionally gated until the service-owned query contract is ready.
3. This matrix defines current formal support boundaries for `TK-301` and the desktop baseline refresh in `TK-547`; full GA readiness signal coverage is tracked in `TK-302`.
