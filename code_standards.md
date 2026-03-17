# Code Standards

This file defines repository-level coding standards and the executable gate commands that enforce them.

## Non-negotiable Rules

- [CS-001] All code changes must pass automated tests before delivery.
- [CS-002] Commit messages for delivered changes must follow Conventional Commits.
- [CS-003] Any TODO/FIXME/HACK marker must be resolved or explicitly recorded as known risk.
- [CS-004] Delivery records must include verification evidence for implemented tasks.
- [CS-005] In this native Node.js ESM repository, all relative import/export specifiers must use explicit file extensions (for example `./foo.js`).
- [CS-006] `src/**` and `test/**` must stay TypeScript-first; newly added `.js` files require an explicit TS-only whitelist entry.
- [CS-007] Non-relative import/export specifiers must not end with `.js/.mjs/.cjs` (for example forbid `pkg/subpath.js`); prefer package export entries.
- [CS-008] Dynamic dependency loading via `import()` or `require()` is forbidden by default. Exceptions are allowed only with explicit benefit and must be annotated nearby as `// dynamic-import-allowed: reason`.
- [CS-009] Finite-set business values must be centrally managed as enums/constants under `src/constants`. One-off local checks may keep literals only when annotated nearby as `// literal-set-allowed: reason`.
- [CS-010] Before adding any new utility function, contributors must evaluate whether `src/utils/` already has a reusable implementation. Confirmed new utility functions must record reuse evaluation in `execution_notes` with signature format `src/utils/<file>#<functionName>`.
- [CS-011] Type semantics must be consistent: object structure contracts use `interface`; union/literal/mapped/conditional/composed utility types use `type`.
- [CS-012] Object structure contracts must not be declared as `type Xxx = { ... }`. Exceptions require a nearby comment: `// type-shape-allowed: reason`.
- [CS-013] `interface` and `type` declarations must be managed in separated directories for new code: `src/types/interfaces/*.interface.ts` and `src/types/aliases/*.type.ts`. Both directories must maintain `index.ts` for aggregated exports.

## Verification Commands

```bash
node ./scripts/governance/check-esm-import-specifiers.js
node ./scripts/governance/check-dynamic-import-usage.js
node ./scripts/governance/check-finite-literal-sets.js
node ./scripts/governance/check-utils-reuse-governance.js
node ./scripts/governance/check-type-governance.js
node ./scripts/governance/check-ts-only-residue.js
npm run test -- --maxWorkers=1 --maxConcurrency=1
node ./dist/bin/repo-ai-governor.js --help >/dev/null
```

## Notes

1. Do not use `npm run check` in verification commands to avoid recursive gate execution.
2. Prefer deterministic commands that can run in CI.
