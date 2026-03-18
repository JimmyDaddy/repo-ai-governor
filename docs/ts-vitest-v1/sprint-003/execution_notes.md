# Sprint 003 Execution Notes

## 2026-03-17

- scope: governance-rules
  - decision: add utility reuse governance and type semantics governance gates.
  - impact: `src/utils` new utilities will require explicit reuse-evaluation records.
  - util-evaluation: no new `src/utils/*` function introduced in this batch.

## 2026-03-18

- scope: tk-3009-utils-reuse-whitelist-retirement
  - decision: retire `scripts/governance/utils-reuse-whitelist.json` legacy baseline exemptions by moving records to `execution_notes`.
  - util: src/utils/common.ts#normalizeLocale
    - reuse-eval: checked `src/utils/common.ts`; locale normalization is the shared base behavior and should be reused rather than duplicated.
  - util: src/utils/common.ts#translateLocale
    - reuse-eval: checked `src/utils/common.ts`; bilingual branch selection already exists and should stay as the single reusable implementation.
  - util: src/utils/common.ts#toRelativePath
    - reuse-eval: checked `src/utils/common.ts`; path rendering helper is centralized and no extra utility file is required.
  - util: src/utils/common.ts#cloneValue
    - reuse-eval: checked `src/utils/common.ts`; cloning helper is shared and existing `structuredClone` wrapper remains the reusable entrypoint.
  - util: src/utils/common.ts#isPlainObject
    - reuse-eval: checked `src/utils/common.ts`; plain-object guard is shared across modules and should not be reimplemented.
  - impact: `allowList` can be cleaned to `[]` while keeping `check-utils-reuse-governance` passing.
