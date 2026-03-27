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
- [CS-009] Finite-set business values must be centrally managed as enums/constants under `src/constants` (or package-level `packages/*/src/constants`). Inline finite string-literal union aliases for closed sets are forbidden by default. One-off local checks may keep literals only when annotated nearby as `// literal-set-allowed: reason`.
- [CS-010] Before adding any new utility function, contributors must evaluate whether `src/utils/` already has a reusable implementation. Confirmed new utility functions must record reuse evaluation in `execution_notes` with signature format `src/utils/<file>#<functionName>`.
- [CS-011] Type semantics must be consistent: object structure contracts use `interface`; union/literal/mapped/conditional/composed utility types use `type`.
- [CS-012] Object structure contracts must not be declared as `type Xxx = { ... }`. Exceptions require a nearby comment: `// type-shape-allowed: reason`.
- [CS-013] `interface` and `type` declarations must be managed in separated directories for new code: `src/types/interfaces/*.interface.ts` and `src/types/aliases/*.type.ts`. Both directories must maintain `index.ts` for aggregated exports. Within each domain/context under `types`, multiple `interface`/`type` declarations may be co-located in one file to reduce fragmentation; split into smaller files only when complexity or maintenance cost clearly increases.
- [CS-014] For monorepo refactor work, naming under `apps/**` and `packages/**` must follow `Monorepo Naming Convention` in this document.
- [CS-015] Requirement -> Solution -> Architecture triad docs (`.repo-ai-governor/normative_knowledge_sources/product-requirements.md`, `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`, `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`) must stay synchronized; any PRD change must also sync `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`.
- [CS-016] When adding or modifying code, contributors should prioritize adding concise comments for non-obvious intent, constraints, and trade-offs. Newly added or modified exported classes/functions in `src/**` and `packages/**` must include JSDoc comments (at minimum: purpose/responsibility, parameter semantics, and return-value semantics; include important behavior constraints when applicable).
- [CS-017] Prefer object-oriented design for domain modules (runtime/workflow/policy/adapter). Related behavior should be encapsulated in classes/services to avoid scattered standalone functions. Pure stateless helpers may remain function-style, but require a nearby justification comment: `// oop-function-allowed: reason`.
- [CS-018] In domain modules (`src/runtime|workflow|policy|adapters` and `packages/core-*|adapter-*|adapters/*`), avoid multiple class declarations in a single file. Inheritable base classes and each derived implementation should be split into separate files/directories by default. Exceptions require a nearby marker comment: `// class-collocation-allowed: reason`.
- [CS-019] General naming convention: variables/functions use `camelCase`; types/interfaces/type aliases/classes/enums use `PascalCase`; constants use `UPPER_SNAKE_CASE`.
- [CS-020] Comments (including inline comments and JSDoc prose) must explain "why" rather than repeating "what the code does". Redundant restatement comments should be avoided.
- [CS-021] Task and sprint ledgers must stay synchronized: for each active stream, canonical task cards, `tasks/checklist.md`, and canonical rows in `tasks/tasks.csv` must stay synchronized for `title/status/owner/priority/project/sprint/plan/recorded_at`; and for all sprint directories under `.repo-ai-governor/context/dev/**`, sprint `plan.md` status must align with latest `tasks/tasks.csv` aggregate status (`planned/active/completed`). Any drift blocks delivery.
- [CS-022] In `apps/**`, `packages/**`, `bin/**`, and `test/**`, do not use native `Error` directly (`new Error`, `extends Error`, `instanceof Error`). Use the standardized error model from `packages/shared/src/errors/` (`BaseError`, `ConfigError`, `I18nError`, `RuntimeError`, `GovernorErrorCode`, `standardizeError`) for throw and output paths. The only allowed `extends Error` location is the abstract base implementation in `packages/shared/src/errors/governor-error.ts`.
- [CS-023] Artifact Registry must enforce lifecycle exit governance: `artifact_status` only uses `active/frozen/deprecated/archived/retired`; main registry (`.repo-ai-governor/context/artifact-registry/artifacts.csv`) only keeps `active/frozen/deprecated`; archive registry (`.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`) only keeps `archived/retired`; stale `deprecated` entries beyond grace window must be archived.
- [CS-024] Test topology must be layered: package-scoped tests belong under `apps/**/test` or `packages/**/test`, while cross-package smoke/integration tests stay under root `test/**`. CI and local verification should run `test:packages` and `test:integration` separately to preserve ownership boundaries and diagnosis clarity.
- [CS-025] Normative loading manifest governance is required: active files under `.repo-ai-governor/normative_knowledge_sources/**` must be registered in `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`; `default_load=true` is only allowed for `L0/L1`; triad docs must keep consistent `active/frozen` status; and gate default mode is `block` with controlled rollback switch.
- [CS-026] Code review lifecycle artifacts under `.repo-ai-governor/context/dev/**/review/` must keep filename state and top-level `Status` metadata synchronized. `code_review_*/review_*` require `Status: review_pending`; `verified_code_review_*/verified_review_*` require `Status: verified`; `resolved_code_review_*/resolved_review_*` require `Status: resolved`.
- [CS-027] Prevent cross-layer God objects. In `apps/**` and `packages/**`, new or substantially modified domain/runtime modules must align to one primary bounded context and at most two adjacent architecture layers from `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md -> 4.1 分层视图`. A single file/class must not simultaneously own three or more responsibility families among `command entry/dispatch`, `workflow/runtime orchestration`, `adapter probing/routing`, `policy/risk decisioning`, `artifact/report persistence`, and `presentation shaping`. Legacy files above `1200` LOC must not absorb new unrelated responsibilities; changes to such files should prefer extraction-first refactors. Temporary exceptions require a nearby marker comment `// god-object-exception: TK-xxx reason` and a task-linked decomposition plan in the active sprint ledger before delivery.
- [CS-028] `.repo-ai-governor/context/current-context.md` may declare at most one `Worktree Review Target` override for default CR routing. When present, it must point to a `completed` stream review directory that still contains open lifecycle artifacts (`code_review_*` / `verified_code_review_*`); once only `resolved` artifacts or no lifecycle files remain, the override must be removed before delivery.
- [CS-029] Technical solution module graph governance is required: `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml` is the single source for module ids, exported/imported contracts, direct dependencies, and loading budgets; active module docs under `.repo-ai-governor/normative_knowledge_sources/technical-solutions/**` must be registered in manifest; contract changes must keep producer module overview synchronized; and the module graph gate defaults to blocking mode.
- [CS-030] Technical solution draft/final lifecycle governance is required: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml` is the single source for draft/review/approved/active/superseded/archived state; `draft_paths` must stay under `.repo-ai-governor/draft/**` and must not enter manifest; `active/superseded` `final_paths` must be manifest-registered; and promotion changes must keep lifecycle registry, review evidence, task ledger, and module registry/manifest (when impacted) synchronized.
- [CS-031] Technical solution delivery handoff governance is required: `.repo-ai-governor/context/technical-solution-delivery-registry.yaml` is the single source for `active technical solution -> docs_only/existing_stream/followup_required` ownership, consumer surfaces, user impact, and rollout status; every `active` solution must declare one delivery entry; `followup_required` entries must resolve to real `project/sprint/task` records and remain visible from `current-context.md` active/planned stream surfaces; user-facing solutions must also declare rollout ownership and evidence; and promotion changes must keep lifecycle registry, delivery registry, `current-context.md`, task ledger, and artifact handoff synchronized.

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

- Package dependency directions should follow `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md -> 模块依赖方向约束`.
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
node ./scripts/governance/check-technical-solution-module-graph.js
node ./scripts/governance/check-technical-solution-lifecycle-registry.js
node ./scripts/governance/check-technical-solution-delivery-registry.js
node ./scripts/governance/check-jsdoc-governance.js
node ./scripts/governance/check-oop-structure.js
node ./scripts/governance/check-package-dependency-boundary.js --mode warn
node ./scripts/governance/check-task-ledger-sync.js
node ./scripts/governance/check-sprint-plan-status-sync.js
node ./scripts/governance/check-code-review-status-sync.js
node ./scripts/governance/check-worktree-review-target.js
node ./scripts/governance/check-standardized-error-usage.js
node ./scripts/governance/check-i18n-parity-fallback.js
node ./scripts/governance/check-artifact-registry-lifecycle.js
node ./scripts/examples/check-examples-smoke.js
node ./scripts/examples/check-examples-runtime.js
node ./scripts/governance/run-normative-loading-manifest-gate.js
pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1
pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1
node ./dist/bin/repo-ai-governor.js --help >/dev/null
```

## Pending Integration Memo

1. Prepared scripts for future gate integration:
   - `scripts/governance/check-monorepo-naming.js`
2. Planned script for follow-up integration:
   - `scripts/governance/check-monorepo-versioning-policy.js`
   - `scripts/governance/check-god-object-boundary.js`
3. Planned command wiring (not active yet):
   - `node ./scripts/governance/check-monorepo-naming.js`
   - `node ./scripts/governance/check-monorepo-versioning-policy.js`
   - `node ./scripts/governance/check-god-object-boundary.js`
4. Current status: `check-package-dependency-boundary` 以 warning 模式接入；`normative-loading-manifest`、`technical-solution-module-graph`、`technical-solution-lifecycle-registry` 与 `technical-solution-delivery-registry` 已切换默认 blocking；其余脚本维持 implementation-ready，待专门窗口激活。

## Notes

1. Do not use `pnpm run check` in verification commands to avoid recursive gate execution.
2. Prefer deterministic commands that can run in CI.
