# GA Readiness Evidence (Master Plan §10.2)

- Status: active
- Evidence date: 2026-03-28
- Scope: `project-026 / sprint-004 / TK-302`

## 1. Summary

- Total signals: 11
- Pass: 10 / 11
- Conditional pass: 1 / 11
- Fail: 0 / 11

Conditional items are explicitly tracked with remaining actions in section 4.

## 2. Signal Matrix

| Signal | Requirement | Status | Evidence |
|---|---|---|---|
| #1 | At least two pilot repos complete `install -> init -> doctor -> check` within 15 minutes | Conditional pass | Pilot evidence in project-020 DA-235/DA-236 confirms two repositories finished the required chain; explicit per-repo elapsed-time telemetry is not yet persisted as one normalized metric row. |
| #2 | Two selected install modes pass clean-room chain three consecutive times each | Pass | `.tmp/project-026-sprint-004/tk302-cleanroom-path-link-report.json` (`path` 3/3, `link` 3/3, chain `--help -> init -> doctor -> check`). |
| #3 | Blackbox user path matrix `init -> doctor -> check -> run -> report/replay` is 100% pass | Pass | `pnpm vitest run --config vitest.e2e.config.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/e2e/cli-help.e2e.test.ts --maxWorkers=1 --maxConcurrency=1` (2 files passed, 4 tests passed). |
| #4 | At least one unattended `plan -> run -> review -> review-verify -> report -> ledger backfill` chain passes three consecutive rehearsals | Pass | `.tmp/project-026-sprint-004/tk302-stage9-blackbox-ga-report.json` (`delivery_rehearsal_eligible_scenarios=3`, `delivery_rehearsal_pass_scenarios=3`, `inlineReviewChainStatus=applied` on delivery-eligible scenarios). |
| #5 | Pilot-era intervention and failure events are fully structured-attribution | Pass | Stage9 report includes scenario-level structured fields (`runtimeStatus`, `hitlRequired`, `hitlDecision`, `localFallbackActivated`, `deliveryRehearsalStatus`) across success/intervention/failure patterns. |
| #6 | At least one clean-room `tool_managed -> repo_local -> rollback` workspace switch passes | Pass | `.tmp/project-026-sprint-004/tk302-cleanroom-path-link-report.json` (`workspaceSwitchRollback.status=passed`). |
| #7 | At least one external consumption contract blackbox matrix passes (config/workspace/i18n precedence + public exports) | Pass | `pnpm vitest run --config vitest.integration.config.ts test/public-package-exports.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1` + `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1` (all passed). |
| #8 | At least one primary + one backup HITL notification provider rehearsal passes with audit/replay backlink | Pass | `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/sprint-001-ga-blocker-notification-provider-implementation/hitl-notification-rehearsal-evidence.md`. |
| #9 | At least one controlled delivery rehearsal covers `commit` or `PR draft` with explicit boundary records | Pass | Stage9 report contains both `*.pr_draft.json` and `*.commit.json` delivery rehearsal artifacts. |
| #10 | Minimum support matrix is declared and matrix-contained clean-room smoke is recorded | Pass | `docs/support-matrix.md` and `docs/support-matrix.zh-CN.md` (published in TK-301). |
| #11 | Operations metrics snapshot is available (onboarding time, violation rate, unattended success, rollback rate, intervention rate) | Pass | Stage9 metrics snapshot is present (`time_to_first_success_ms`, `unattended_success_rate`, `human_intervention_rate`, `fallback_rate`, `delivery_rehearsal_pass_rate`), and repository-wide verification baselines were re-validated on 2026-03-28 (`pnpm run check`, `pnpm run test:coverage`). |

## 3. Command Evidence Snapshot

1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link --iterations 3 --output .tmp/project-026-sprint-004/tk302-cleanroom-path-link-report.json`
2. `pnpm vitest run --config vitest.e2e.config.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/e2e/cli-help.e2e.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/ci/run-stage9-blackbox-ga-baseline.js --output .tmp/project-026-sprint-004/tk302-stage9-blackbox-ga-report.json`
4. `pnpm vitest run --config vitest.integration.config.ts test/public-package-exports.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
5. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 4. Open Follow-Ups

1. Add explicit per-pilot onboarding elapsed-time rows to remove signal #1 conditional status.
2. Keep periodic regression snapshots for repository-level baselines:
   - `pnpm run check` and `pnpm run test:coverage` both passed on 2026-03-28 after quote-compatible parser hardening in governance/example smoke scripts.
