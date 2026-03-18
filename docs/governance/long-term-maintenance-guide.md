# Repository Long-Term Maintenance Guide

- Status: active
- Established: 2026-03-18
- Scope: `repo-ai-governor`

## Source Hierarchy

1. Normative rules: `code_standards.md` (`CS-001` to `CS-013`)
2. Operational baseline: this guide (`docs/governance/long-term-maintenance-guide.md`)
3. Sprint execution records: `docs/<project>/<sprint>/`

This guide does not duplicate rule text from `code_standards.md`. It defines how to run and sustain those rules over time.

## Agent Startup Baseline

1. Read `AGENTS.md`
2. Read `code_standards.md`
3. Read this guide
4. Read `.repo-ai-governor/context/current-context.md`

## Rule Set Mapping

1. Delivery quality baseline: `CS-001` to `CS-004`
2. ESM/TS boundary baseline: `CS-005` to `CS-008`
3. Constant and type governance baseline: `CS-009` to `CS-013`

For command-level enforcement, always use `code_standards.md -> Verification Commands` as the single source of truth.

## Daily and Release Cadence

1. Development baseline:
   - `npm run typecheck`
   - `npm run test -- <target>`
   - `npm run check`
2. Release baseline:
   - `npm run ci:quality`
   - `npm run release:ga-check`

## Whitelist Governance Policy

1. `scripts/governance/ts-only-whitelist.json`
   - Allowed only for explicit compatibility constraints with reasoned entries.
2. `scripts/governance/literal-set-whitelist.json`
   - Target baseline is empty.
3. `scripts/governance/type-governance-whitelist.json`
   - Target baseline is empty.
4. `scripts/governance/utils-reuse-whitelist.json`
   - Target baseline is empty.
   - Reuse evaluation belongs in sprint `execution_notes.md` records.

Any non-empty entry must include task-level traceability in `tasks/checklist.md` and `tasks/tasks.csv`.

## Documentation Sync Rules

1. Governance behavior changes must update both `README.md` and `README.zh-CN.md`.
2. Sprint-level execution changes must update `plan.md`, `tasks/checklist.md`, and `tasks/tasks.csv`.
3. Closure work must include a written closure report in the sprint docs.

## Monthly Audit Checklist

1. Re-run `npm run check` and `npm run release:ga-check`.
2. Confirm whitelist files match expected baseline (empty or explicitly justified).
3. Re-check stability/coverage baselines if test topology changed.
4. Review `execution_notes.md` for util reuse records and unresolved debt.

## Ownership

1. Core: governance scripts, standards integration, task-ledger integrity
2. QA: stability and coverage baselines
3. Release: runtime JS boundary and release candidate gates
