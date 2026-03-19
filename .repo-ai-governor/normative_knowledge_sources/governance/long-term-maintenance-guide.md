# Repository Long-Term Maintenance Guide

- Status: active
- Established: 2026-03-18
- Scope: `repo-ai-governor`

## Source Hierarchy

1. Normative rules: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` (`CS-001` to `CS-020`)
2. Operational baseline: this guide (`.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`)
3. Sprint execution records: `.repo-ai-governor/docs/dev/<project>/<sprint>/`

This guide does not duplicate rule text from `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`. It defines how to run and sustain those rules over time.

## Agent Startup Baseline

1. Read `AGENTS.md`
2. Read `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
3. Read this guide
4. Read `.repo-ai-governor/context/current-context.md`

## Rule Set Mapping

1. Delivery quality baseline: `CS-001` to `CS-004`
2. ESM/TS boundary baseline: `CS-005` to `CS-008`
3. Constant and type governance baseline: `CS-009` to `CS-013`
4. Monorepo naming baseline: `CS-014`
5. Triad docs synchronization baseline: `CS-015`
6. Code readability and architecture style baseline: `CS-016` to `CS-020`

For command-level enforcement, always use `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands` as the single source of truth.

## Pending Gate Integration Memo

1. Prepared scripts:
   - `scripts/governance/check-monorepo-naming.js`
   - `scripts/governance/check-package-dependency-boundary.js`
2. Planned script:
   - `scripts/governance/check-monorepo-versioning-policy.js`
3. Planned wiring target: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands`.
4. Current decision: keep scripts as implementation-ready assets and defer activation to a dedicated follow-up window.

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
5. `scripts/governance/jsdoc-governance-whitelist.json`
   - Records legacy exported APIs pending JSDoc backfill.
   - New or modified exports should avoid new whitelist entries whenever possible.
6. `scripts/governance/oop-structure-whitelist.json`
   - Records legacy OOP-structure exceptions (for example domain-level exported functions or temporary class co-location) pending migration.
   - Prefer class/service migration and class split first; whitelist only for compatibility windows.

Any non-empty entry must include task-level traceability in `tasks/checklist.md` and `tasks/tasks.csv`.

## Documentation Sync Rules

1. Governance behavior changes must update both `README.md` and `README.zh-CN.md`.
2. Sprint-level execution changes must update `plan.md`, `tasks/checklist.md`, and `tasks/tasks.csv`.
3. Closure work must include a written closure report in the sprint docs.
4. Document date metadata must use `YYYY-MM-DD`; linked core docs should refresh dates in the same change window.
5. Changes to any triad doc under `.repo-ai-governor/normative_knowledge_sources/` (`product-requirements` / `overall-technical-solution` / `architecture-and-repo-layering`) must be synchronized in the same change set; PRD changes must sync `product-requirements-brief.md`.

## Monthly Audit Checklist

1. Re-run `npm run check` and `npm run release:ga-check`.
2. Confirm whitelist files match expected baseline (empty or explicitly justified).
3. Re-check stability/coverage baselines if test topology changed.
4. Review `execution_notes.md` for util reuse records and unresolved debt.

## Ownership

1. Core: governance scripts, standards integration, task-ledger integrity
2. QA: stability and coverage baselines
3. Release: runtime JS boundary and release candidate gates
