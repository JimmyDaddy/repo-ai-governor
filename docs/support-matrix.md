# Repo AI Governor Support Matrix

- Status: active
- Last updated: 2026-04-06
- Scope: formal support declaration refreshed by `project-026 / sprint-004` (`TK-301`), `project-044 / sprint-003` (`TK-547`), `project-046 / sprint-001` (`TK-551`, `TK-552`, `TK-554`), `project-052 / sprint-001` (`TK-589`, `TK-590`, `TK-591`), `project-052 / sprint-002` (`TK-592`, `TK-593`, `TK-594`), `project-052 / sprint-003` (`TK-595`, `TK-596`), and `project-053 / sprint-001` (`TK-598`, `TK-599`, `TK-600`)

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
| `claude-code` | Real-path available (environment-gated) | `cli_exec` is the default real transport when selected, `remote_api` remains optional, and `verify --adapters` now projects the effective default transport truth even when config omits `transport`; current workspace readiness still warns when the local Claude health-check fails. |
| `local-model` (`ollama`) | Fixture-backed (local-runtime constrained) | Supported local fallback surface; `tool_calling`, `structured_output`, and `confirmation_gate` remain conservative/degraded by design. |

### 2.1 Adapter Truth Labels

1. `Real-path available` means the adapter can expose non-fixture execution truth (`cli_exec` or optional `remote_api`) when selected, even if the current workspace still has environment-precondition warnings.
2. `Fixture-backed` means the product surface is supported, but the formal public evidence remains routing/fixture truth instead of a promoted real invocation path.

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

## 6. Verification Snapshot (TK-301 + TK-547 + TK-551/TK-552/TK-554 + TK-589/TK-590/TK-591 + TK-592/TK-593/TK-594 + TK-598/TK-599/TK-600)

| Time (UTC) | Command | Result | Evidence |
|---|---|---|---|
| 2026-04-06T16:26:31Z | `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run` | Warn | `.tmp/project-053-sprint-001-run-dry-run-trace.json` plus the emitted report/replay/diagnostics artifacts preserved `dry_run=true`, `policy_outcome=allow`, and stage-level failure attribution at `stage-task-prepare`, even though the current default route still failed on `codex`. |
| 2026-04-06T16:25:22Z | `node ./dist/bin/repo-ai-governor.js --output json --adapters verify` | Warn (non-blocking) | `.tmp/project-053-sprint-001-verify-adapters.json` and the verify diagnostics artifact surfaced `claude-code` as effective `cli_exec` with `request_timeout_ms=30000`, `max_retries=2`, and an environment-precondition health-check warning instead of a silent `null` transport. |
| 2026-04-06T21:29:47Z | `repo-external upgrade rehearsal (preview -> apply -> rollback)` | Pass | `.tmp/project-052-sprint-002-command-rehearsal-summary.json` recorded `schema_upgrade_analyze`, `schema_upgrade_apply`, and `schema_upgrade_rollback`; apply and rollback both finished with `verify_status=passed`. |
| 2026-04-06T21:29:47Z | `repo-external workspace rehearsal (dry-run -> execute -> rollback)` | Pass | `.tmp/project-052-sprint-002-command-rehearsal-summary.json` recorded `workspace_migration_plan`, `workspace_migration_execute`, and `workspace_migration_rollback`; rollback returned to the source workspace and `scratch_cleanup_status=removed`. |
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

## 7. Upgrade / Workspace Contract Snapshot (TK-592)

1. `workspace` formal adopter path is `dry-run -> execute -> rollback`; `rollback` only consumes the saved `plan-path`, and failed execute flows persist `context/workspace/<migration-id>.failure.json` before retry.
2. `upgrade` formal adopter path is `preview -> apply -> rollback`; `apply` only consumes one preview `report_path` plus explicit `--confirm-upgrade approve`, and rollback accepts one apply receipt or rollback snapshot.
3. `docs/local-adoption-playbook*.md` is the canonical adopter guide for artifact hand-off and troubleshooting, while `README*` keeps only the minimal command surface.

## 8. Troubleshooting / Acceptance Snapshot (TK-594)

1. Save `plan_path`, `report_path`, and at least one rollback hand-off artifact (`apply_receipt_path` or `rollback_snapshot_path`) before mutating adopter state; the supported closeout path depends on those artifacts.
2. If `upgrade` preview reports blocking confirmation items, stop before `apply`, review the preview artifacts, and rerun preview only after the configuration drift is understood.
3. After `workspace execute` or `workspace rollback`, rerun `doctor` to confirm the active `workspaceRoot` instead of inferring success from directory layout alone.
4. Rehearsal and pilot runs should use target repositories or isolated external temp directories; running workspace migration from the governor source repository can attach to the outer Git root and create misleading artifacts.
5. `.tmp/project-052-sprint-002-command-rehearsal-summary.json` is the formal sprint-002 acceptance evidence for the repo-external upgrade/workspace closeout path.

## 9. GA Support Truthfulness Snapshot (TK-596)

1. `docs/support-matrix*.md` is now the single public truth surface for current support status plus GA support truthfulness.
2. `docs/maintainer-validation-playbook*.md` remains the maintainer runbook and backlink router; it should not keep a parallel support-status table.
3. `docs/ga-readiness-evidence*.md` remains the program-level signal matrix and may backlink to this section, but it does not redefine the public support boundary.

| Claim scope | Audience | Surface | Status | Evidence time (UTC) | Evidence command / artifact | Evidence summary | Backlink target | Refresh trigger | Residual risk |
|---|---|---|---|---|---|---|---|---|---|
| clean-room install baseline | adopter + maintainer | `path` / `link` install modes | Pass | 2026-04-06T12:09:11Z | `.tmp/project-052-sprint-001-cleanroom-report.json` | `path` and `link` both passed the clean-room chain and covered workspace-switch rollback prechecks. | `docs/maintainer-validation-playbook.md`, `.tmp/project-052-sprint-001-cleanroom-report.json` | install-mode contract or packaged runtime changes | Wider `tgz` / registry-backed packaged install still depends on separate packaged distribution rehearsal. |
| packaged distribution rehearsal | maintainer | local distribution / packaged surface | Pass | 2026-04-06T12:08:49Z | `.tmp/project-052-sprint-001-local-distribution-report.json` | Local distribution verified the packed governor surface and kept adapter `doctor/verify` as non-blocking warn rather than a hard support failure. | `docs/maintainer-validation-playbook.md`, `.tmp/project-052-sprint-001-local-distribution-report.json` | packaging layout, release asset, or dist runtime changes | Adapter warn semantics remain environment-precondition dependent. |
| repo-external upgrade/workspace closeout | adopter + maintainer | `upgrade` and `workspace` user path | Pass | 2026-04-06T21:29:47Z | `.tmp/project-052-sprint-002-command-rehearsal-summary.json` | External rehearsal passed `preview -> apply -> rollback` and `dry-run -> execute -> rollback`, including rollback verification and scratch cleanup. | `docs/local-adoption-playbook.md`, `.tmp/project-052-sprint-002-command-rehearsal-summary.json` | command contract, rollback artifact semantics, or troubleshooting flow changes | Final project completion promotion now depends only on the clean project-final review and final closeout write-back. |
| maintainer release runbook | maintainer | local release-gate rehearsal | Pass | 2026-04-04T12:12:23Z | `pnpm run release:verify-local` | The maintainer gate still proves CLI help smoke, desktop entry smoke, examples runtime smoke, dist-binary remote-api smoke, and packed-surface truthfulness in one runbook step. | `docs/maintainer-validation-playbook.md` | release gate composition or packaged surface changes | This row is a runbook-backed rehearsal, not a new public support contract. |
| program-level GA signals | maintainer + project-closeout | cross-stage GA readiness | Pass | 2026-04-05 | `docs/ga-readiness-evidence.md` | The broader GA signal matrix remains green and now back-links to this support truth surface instead of serving as a parallel public claim. | `docs/ga-readiness-evidence.md` | GA signal thresholds or upstream evidence refresh | The completion recommendation is prepared; final project completion promotion still depends on the clean project-final review and final closeout write-back. |

4. The prepared `project-052` closeout recommendation now lives in `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/project-052-adopter-truthfulness-and-ga-closeout-completion-audit-summary.md`; the final `completed` verdict now depends only on the clean project-final review loop and the final completion write-back.

## 10. Notes

1. Adapter degrade or warning signals remain environment-precondition related (`github-copilot` quota/probe, `claude-code` CLI health-check/auth preconditions, `local-model` endpoint/model capability limits) rather than governance-chain failure.
2. `project-046` promotes the desktop artifact pane from deferred gate to a service-owned typed query contract; renderer consumers still do not bypass the workspace filesystem directly.
3. Official `GitLab CI` and `Jenkins` templates are now published under `integrations/ci/` and reuse the same install, quality-gate, and release-governance command contract as GitHub Actions.
4. This matrix defines current formal support boundaries for `TK-301`, the desktop MVP foundation refresh in `TK-547`, the P1 product-surface closure work in `project-046`, the install-mode truth refresh in `project-052 / sprint-001`, the upgrade/workspace contract plus acceptance closeout in `project-052 / sprint-002`, the GA support truthfulness consolidation in `project-052 / sprint-003`, and the `claude-code` real-path baseline truth refresh in `project-053 / sprint-001`; broader GA readiness signal closure and the remaining adapter rollout continue in later project-053 sprints.
