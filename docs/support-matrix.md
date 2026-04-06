# Repo AI Governor Support Matrix

- Status: active
- Last updated: 2026-04-06
- Scope: formal support declaration refreshed by `project-026 / sprint-004` (`TK-301`), `project-044 / sprint-003` (`TK-547`), `project-046 / sprint-001` (`TK-551`, `TK-552`, `TK-554`), and `project-052 / sprint-001` (`TK-589`, `TK-590`, `TK-591`)

## 1. Installation Modes

| Mode | Status | Notes |
|---|---|---|
| `path` (`pnpm add <repo>`) | Supported | Default local adoption path for iterative development. |
| `link` (`pnpm add link:<repo>`) | Supported | Recommended only when the target repository should follow live governor source changes. |
| `dist-binary` (`node dist/bin/repo-ai-governor.js`) | Supported | Preferred no-install rehearsal path for dirty or non-`pnpm` repositories. |
| `tgz` (`pnpm pack` + `pnpm add <tarball>`) | Supported (online) | Requires registry/network reachability for runtime dependencies. |

### 1.1 Adopter Acceptance Contract

1. `Supported` means the documented baseline chain for that mode is reproducible under the preconditions named in the notes column and linked playbooks.
2. `path` is the default recommended install path for clean `pnpm` target repositories.
3. `link` stays supported, but only when the target repo is intentionally following local governor source changes.
4. `dist-binary` is the preferred path for dirty or non-`pnpm` target repositories and proves CLI/runtime behavior only; it does not prove packaged-install behavior.
5. `tgz` is limited to registry-enabled packaged-install rehearsal; offline or self-contained tarball installation remains unsupported.

## 2. Adapter Surfaces

| Adapter surface | Status | Notes |
|---|---|---|
| `codex` | Fixture-backed | Primary route in current verification baseline. |
| `github-copilot` | Fixture-backed | Supported adapter surface with fallback/degraded routing semantics when quota or probe preconditions fail. |
| `claude-code` | Fixture-backed | Supported adapter surface with fallback/degraded routing semantics when credential or probe preconditions fail. |
| `local-model` (`ollama`) | Fixture-backed (local-runtime constrained) | Supported local fallback surface; `tool_calling`, `structured_output`, and `confirmation_gate` remain conservative/degraded by design. |

## 3. Published Governance Packs

| Pack | Status | Notes |
|---|---|---|
| TypeScript repository baseline | Built-in | Full governance chain in repository baseline. |
| Workflow review | Minimal baseline | `workflowReviewGovernancePack` is published via `@repo-ai-governor/standards` and carries the `CR-xxx` review task-card lifecycle. |
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
| Desktop sidecar entry | Supported for MVP foundation | `apps/desktop` now exposes the formal desktop shell package with service-owned session/execution/HITL/artifact-pane seams; `check-desktop-entry-smoke` and `release:verify-local` stay in the release baseline while richer desktop panels remain staged evolution. |

## 6. Verification Snapshot (TK-301 + TK-547 + TK-551/TK-552/TK-554 + TK-589/TK-590/TK-591)

| Time (UTC) | Command | Result | Evidence |
|---|---|---|---|
| 2026-04-06T12:09:11Z | `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link --iterations 1 --output .tmp/project-052-sprint-001-cleanroom-report.json` | Pass | `path` and `link` both passed one clean-room baseline iteration; workspace switch rollback, read-only attach precheck, service-host memory provider, and remote-api smoke also passed for both modes. |
| 2026-04-06T12:08:49Z | `node ./scripts/release/verify-local-distribution.js --output .tmp/project-052-sprint-001-local-distribution-report.json` | Pass | local distribution verified, `pack_file=cjhdev-repo-ai-governor-0.1.5.tgz`; standards runtime-loader dist smoke and dist-binary remote-api smoke passed, while adapter `doctor/verify` stayed at non-blocking `warn`. |
| 2026-04-04T12:09:14Z | `pnpm run build` | Pass | `dist/apps/desktop` and `dist/node_modules/@repo-ai-governor/desktop` materialized for local distribution validation |
| 2026-04-04T12:09:14Z | `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` | Pass | `118` files and `734` tests passed |
| 2026-04-04T12:09:14Z | `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` | Pass | `19` files and `47` tests passed |
| 2026-04-04T12:12:23Z | `pnpm run release:verify-local` | Pass | CLI help smoke + desktop entry smoke + examples runtime smoke + dist-binary remote-api smoke + packed-surface truthfulness all passed |
| 2026-04-05T02:13:09Z | `pnpm vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-session-bridge.test.ts test/desktop-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1` | Pass | Desktop artifact-pane query contract, preload bridge, shell baseline, and smoke integration all passed against the ready-state gate. |
| 2026-04-05T02:17:45Z | `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1` | Pass | `github-copilot`, `claude-code`, `local-model`, and first-batch routing fallback coverage all passed in one targeted verification slice. |
| 2026-03-27T22:38:31Z | `node ./dist/bin/repo-ai-governor.js doctor --output pretty` | Pass | `attach_mode=read_write`, `operation=env_doctor` |
| 2026-03-27T22:38:38Z | `node ./dist/bin/repo-ai-governor.js verify --output pretty --adapters` | Warn (non-blocking) | `adapters_status=warn`, required role failures `0` |
| 2026-03-27T22:39:17Z | `node ./dist/bin/repo-ai-governor.js workspace --workspace-action dry-run --workspace-mode repo_local --output pretty` | Pass | workspace plan emitted under active workspace root |
| 2026-03-27T22:39:21Z | `node ./scripts/release/verify-local-distribution.js` | Pass | local distribution verified, `pack_file=cjhdev-repo-ai-governor-0.1.5.tgz` |
| 2026-03-27T22:39:31Z | `node ./scripts/examples/check-desktop-entry-smoke.js` | Pass | desktop sidecar runtime smoke passed for default distribution mode |

## 7. Notes

1. Adapter degrade or warning signals remain environment-precondition related (`github-copilot` quota/probe, `claude-code` credential/probe, `local-model` endpoint/model capability limits) rather than governance-chain failure.
2. `project-046` promotes the desktop artifact pane from deferred gate to a service-owned typed query contract; renderer consumers still do not bypass the workspace filesystem directly.
3. Official `GitLab CI` and `Jenkins` templates are now published under `integrations/ci/` and reuse the same install, quality-gate, and release-governance command contract as GitHub Actions.
4. This matrix defines current formal support boundaries for `TK-301`, the desktop MVP foundation refresh in `TK-547`, the P1 product-surface closure work in `project-046`, and the install-mode truth refresh in `project-052 / sprint-001`; GA readiness signal closure continues in `TK-302`.
