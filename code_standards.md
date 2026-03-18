# Code Standards

This file defines repository-level coding standards and the executable gate commands that enforce them.

## Non-negotiable Rules

- [CS-001] All code changes must pass automated tests before delivery.
- [CS-002] Commit messages for delivered changes must follow Conventional Commits.
- [CS-003] Any TODO/FIXME/HACK marker must be resolved or explicitly recorded as known risk.
- [CS-004] Delivery records must include verification evidence for implemented tasks.
- [CS-005] In this native Node.js ESM repository, all relative import/export specifiers must use explicit file extensions (for example `./foo.js`).
- [CS-006] `src/**` and `test/**` must stay TypeScript-first; newly added `.js` files require an explicit TS-only whitelist entry with reason (`pathAllowList[{path, reason}]`). Any new `.js` outside `src/test` must match `outOfScopeAllowList` with explicit reason.
- [CS-007] Non-relative import/export specifiers must not end with `.js/.mjs/.cjs` (for example forbid `pkg/subpath.js`); prefer package export entries.
- [CS-008] Dynamic dependency loading via `import()` or `require()` is forbidden by default. Exceptions are allowed only with explicit benefit and must be annotated nearby as `// dynamic-import-allowed: reason`.
- [CS-009] Finite-set business values must be centrally managed as enums/constants under `src/constants`. One-off local checks may keep literals only when annotated nearby as `// literal-set-allowed: reason`.
- [CS-010] Before adding any new utility function, contributors must evaluate whether `src/utils/` already has a reusable implementation. Confirmed new utility functions must record reuse evaluation in `execution_notes` with signature format `src/utils/<file>#<functionName>`.
- [CS-011] Type semantics must be consistent: object structure contracts use `interface`; union/literal/mapped/conditional/composed utility types use `type`.
- [CS-012] Object structure contracts must not be declared as `type Xxx = { ... }`. Exceptions require a nearby comment: `// type-shape-allowed: reason`.
- [CS-013] `interface` and `type` declarations must be managed in separated directories for new code: `src/types/interfaces/*.interface.ts` and `src/types/aliases/*.type.ts`. Both directories must maintain `index.ts` for aggregated exports.
- [CS-014] For monorepo refactor work, naming under `apps/**` and `packages/**` must follow `Monorepo Naming Convention` in this document.
- [CS-015] Requirement -> Solution -> Architecture triad docs (`docs/product-requirements.md`, `docs/repo-ai-governor-overall-technical-solution.md`, `docs/repo-ai-governor-architecture-and-repo-layering.md`) must stay synchronized; any PRD change must also sync `docs/product-requirements-brief.md`.

## Monorepo Naming Convention (Refactor Baseline)

This section defines the approved naming baseline for the upcoming monorepo refactor.
Automated gate enforcement for this baseline can be added in a follow-up iteration; this round records the standard only.

### 1) Workspace And Package/App Directory Names

- Use lowercase kebab-case for all app/package directories.
- App directory format: `apps/<app-name>/` (for example `apps/cli/`).
- Package directory format: `packages/<package-name>/` (for example `packages/core-runtime/`).
- Provider group format: `packages/<provider-group>/<provider-name>/` (for example `packages/notification-providers/webhook/`).

### 2) Source File Names

- Use lowercase kebab-case for source files by default.
- `index.ts` is allowed only as the public entry or barrel file of a directory.
- Use role-oriented suffixes when meaningful:
  - command modules: `*-command.ts`
  - shared command helpers: `*-shared.ts`
  - runtime modules: `*-runtime.ts`
  - registries: `*-registry.ts`
  - dispatchers: `*-dispatcher.ts`
  - models: `*-model.ts`
- Keep type/schema file suffixes consistent with existing standards:
  - interfaces: `*.interface.ts`
  - aliases: `*.type.ts`
  - schemas: `*.schema.json`

### 3) Test File Names

- Unit tests: `*.test.ts`
- Contract tests: `*.contract.test.ts`
- Integration tests: `*.integration.test.ts`
- End-to-end tests: `*.e2e.test.ts`

### 4) Package/App Internal Layout Baseline

- Recommended minimum layout:
  - `src/`
  - `test/`
  - `README.md`
- If package-level publishing is needed, add `package.json` with explicit exports.

### 5) Migration Rule

- Existing files are not required to be renamed in bulk immediately.
- All newly created files/directories in `apps/**` and `packages/**` should follow this naming convention.
- When touching legacy names during refactor, prefer migrating them to this convention in the same change when risk is manageable.

## Monorepo Version And Dependency Boundary Baseline (Pending Enforcement)

This section records the approved monorepo governance baseline for follow-up gate integration.

### 1) Versioning Strategy

- `core-*`, `adapter-sdk`, and `shared-*` should use a lockstep release strategy.
- `adapters/*`, `memory-providers/*`, and `notification-providers/*` can use independent versioning.
- Any major version change in `adapter-sdk` or storage/notification adapter contracts must trigger cross-package contract verification.

### 2) Dependency Direction Strategy

- Package dependency directions should follow `docs/repo-ai-governor-architecture-and-repo-layering.md -> 模块依赖方向约束`.
- Cross-layer reverse dependencies should be treated as violations and tracked with explicit task-level remediation plans.

## Verification Commands

```bash
node ./scripts/governance/check-esm-import-specifiers.js
node ./scripts/governance/check-dynamic-import-usage.js
node ./scripts/governance/check-finite-literal-sets.js
node ./scripts/governance/check-utils-reuse-governance.js
node ./scripts/governance/check-type-governance.js
node ./scripts/governance/check-ts-only-residue.js
node ./scripts/governance/check-docs-triad-sync.js
npm run test -- --maxWorkers=1 --maxConcurrency=1
node ./dist/bin/repo-ai-governor.js --help >/dev/null
```

## Pending Integration Memo

1. Prepared scripts for future gate integration:
   - `scripts/governance/check-monorepo-naming.js`
   - `scripts/governance/check-package-dependency-boundary.js`
2. Planned script for follow-up integration:
   - `scripts/governance/check-monorepo-versioning-policy.js`
3. Planned command wiring (not active yet):
   - `node ./scripts/governance/check-monorepo-naming.js`
   - `node ./scripts/governance/check-package-dependency-boundary.js`
   - `node ./scripts/governance/check-monorepo-versioning-policy.js`
4. Current status: keep scripts as implementation-ready assets, but do not add them to `Verification Commands` in this round.

## Notes

1. Do not use `npm run check` in verification commands to avoid recursive gate execution.
2. Prefer deterministic commands that can run in CI.
