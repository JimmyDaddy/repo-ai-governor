# Release Governance Spec

- Status: active
- Date: 2026-03-22
- Scope: stage-7 release governance baseline
- Owner: `project-006-hardening-and-release / TK-058`

## 1. Purpose

1. Define release governance baseline for Stage 7 hardening.
2. Keep release behavior auditable and repeatable across `canary -> rc -> ga`.
3. Protect runtime distribution quality with script-based checks.

## 2. Versioning Boundary

Source of truth: `scripts/release/release-governance-policy.json`.

### 2.1 Lockstep Group

1. `core-*`
2. `adapter-sdk`
3. `shared`

Lockstep packages are promoted and versioned together to avoid contract drift across core runtime boundaries.

### 2.2 Independent Group

1. `adapters/*`
2. `memory-providers/*`
3. `notification-providers/*`

Independent packages can release on separate cadence, but must still pass channel-level checks before promotion.

## 3. Channel Lifecycle

### 3.1 Canary

Entry checks:

1. `pnpm run release:check`
2. `pnpm run test:contract`

Promotion criteria:

1. Stage-7 contract matrix stays stable.
2. No block-level release governance issue.

### 3.2 RC

Entry checks:

1. `pnpm run release:candidate`

Promotion criteria:

1. `ci:quality` baseline is green.
2. Local distribution verification is green.

### 3.3 GA

Entry checks:

1. `pnpm run release:ga-check`

Promotion criteria:

1. RC checks are green in the same release window.
2. Rollback playbook and audit evidence are available.

## 4. Rollback And Audit Evidence

### 4.1 Rollback Triggers

1. Critical production regression detected.
2. Release gate violation after channel promotion.
3. Incompatible contract change in lockstep group.

### 4.2 Minimum Audit Evidence

1. `release_check_report`
2. `distribution_verify_result`
3. `channel_promotion_record`

## 4.3 Rehearsal Execution Baseline

1. Rehearsal entry command: `pnpm run release:rollback-rehearsal`.
2. Rehearsal report path:
   - `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-061-rollback-rehearsal-report.json`
3. Rehearsal scenarios:
   - `critical-production-regression`
   - `post-promotion-gate-violation`
   - `lockstep-contract-incompatibility`
4. Rehearsal pass condition:
   - all three scenarios succeed and minimum audit evidence keys are present.

## 5. Runtime Distribution Validation

1. `release:check` validates release governance spec, policy config, runtime JS whitelist, and release script wiring.
2. `release:verify-local` validates local CLI help runtime and package tarball required files.
3. `check:runtime-js-whitelist` validates runtime JS outputs under `dist/` stay inside allow-list scope.

## 5.1 GA Candidate Unified Gate Baseline

1. Unified gate entry command: `pnpm run release:ga-candidate-unified-gate`.
2. Unified gate report path:
   - `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-062-ga-candidate-unified-gate-report.json`
3. Unified gate check groups:
   - `contract-baseline`
   - `resilience-regression`
   - `integration-regression`
   - `e2e-regression`
   - `release-ga-check`
   - `rollback-rehearsal`
   - `governance-gate`
4. Unified gate semantics:
   - any step failure blocks GA candidate promotion.

## 6. Update Protocol

1. Any change to release channels, rollback policy, or boundary grouping must update:
   - this document,
   - `scripts/release/release-governance-policy.json`,
   - related task ledger records.
2. Any change in runtime distribution structure must update:
   - `scripts/release/runtime-js-whitelist.json`,
   - `scripts/release/check-runtime-js-whitelist.js` if matcher semantics change.
3. Changes must pass:
   - `pnpm run release:check`
   - `pnpm run release:ga-check`
   - `pnpm run check`
