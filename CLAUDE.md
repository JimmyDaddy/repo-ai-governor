# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Repo AI Governor** is a repository-local AI governance CLI (`repo-ai-governor`) for orchestrating AI development workflows. It governs how AI agents (Codex, GitHub Copilot, Claude Code, etc.) operate within a repository — managing planning, execution, review, and delivery lifecycle.

## Commands

### Build & Typecheck
```bash
pnpm install                        # install dependencies
pnpm run build                      # tsc + copy runtime assets -> dist/
pnpm run typecheck                  # tsc --noEmit (no emit)
```

### Format & Lint
```bash
pnpm run format                     # biome format --write
pnpm run lint                       # biome check
```

### Testing
```bash
pnpm run test                       # all unit tests (apps/**/test, packages/**/test, test/**)
pnpm run test:packages              # package-scoped unit tests only
pnpm run test:contract              # contract tests (*.contract.test.ts)
pnpm run test:integration           # cross-package integration tests (test/**/*.integration.test.ts)
pnpm run test:e2e                   # end-to-end tests (test/e2e/**)
pnpm run test:coverage              # run tests with v8 coverage
```

Run a single test file:
```bash
pnpm vitest run --config vitest.packages.config.ts packages/core-runtime/test/foo.test.ts
pnpm vitest run --config vitest.integration.config.ts test/memory-session-store.integration.test.ts
```

### Full Gate Check (CI equivalent)
```bash
pnpm run check        # runs all gate checks via turbo (format -> lint -> build -> governance checks -> tests)
pnpm run ci:quality   # typecheck + check + coverage thresholds
```

Individual governance checks (non-recursive — do NOT use `pnpm run check` inside these):
```bash
node ./scripts/governance/check-esm-import-specifiers.js
node ./scripts/governance/check-finite-literal-sets.js
node ./scripts/governance/check-type-governance.js
node ./scripts/governance/check-standardized-error-usage.js
node ./scripts/governance/check-package-dependency-boundary.js --mode warn
node ./scripts/governance/check-task-ledger-sync.js
node ./scripts/governance/check-code-review-status-sync.js
```

### Run the CLI (after build)
```bash
pnpm run start                      # build + run --help
node ./dist/bin/repo-ai-governor.js --help
```

## Architecture

### Layered Architecture

The system is organized into these layers (top to bottom, dependency flows downward):

1. **Entry Layer** (`apps/cli`, future `integrations/desktop`) — CLI commands, IDE/agent surfaces, CI invoker, Local Orchestration Service
2. **Config & Schema Layer** (`packages/config`) — Config loader, schema validator, profile/workspace resolver
3. **Memory & Context Layer** (`packages/core-memory`, `packages/memory-store-adapter`, `packages/memory-providers/*`, `packages/core-session`) — normative knowledge sources + operational state
4. **Governance Core Layer** (`packages/core-process`, `packages/core-runtime`, `packages/core-runtime-langgraph`, `packages/core-policy`, `packages/core-change-risk`, `packages/core-role-registry`) — process compiler, runtime facade, LangGraph adapter, policy gate, risk evaluator
5. **Agent & Adapter Layer** (`packages/adapter-sdk`, `packages/adapters/*`) — adapter contracts + per-tool implementations (codex, github-copilot, claude-code)
6. **Standards & Slot Layer** (`packages/standards`, `packages/slots`) — rule rendering, agents projection, policy rule compilation, slot injection
7. **Notification Layer** (`packages/notification-dispatcher`) — HITL notification dispatch + escalation
8. **Audit & Reporting Layer** (`packages/reporting`) — audit recorder, report builder, CLI output presenter
9. **Shared** (`packages/shared`) — shared types, errors, i18n (i18next), utils — no business domain dependencies

### Key Dependency Rules

- `apps/cli` may depend on `packages/*`; packages must NOT depend on `apps/cli`
- `core-*` packages may not depend on `apps/cli` or concrete `adapters/*`
- `adapters/*` and `memory-providers/*` only depend on their respective SDK/adapter and `shared`
- `shared` has no business domain dependencies
- `core-runtime-langgraph` must not depend on `apps/cli` or any desktop UI

### Runtime Flow

1. CLI command → `Local Orchestration Service` → config load → workspace resolve
2. `Process Runtime (Facade)` compiles the DSL/IR process graph, dispatches to `LangGraph Runtime Adapter`
3. Each stage: read session → risk evaluation → policy gate → adapter invocation → memory/audit write
4. HITL escalation via `Notification Dispatcher`; resume/terminate/degrade on human decision
5. Output via `CLI Output Presenter` (pretty/plain/json modes)

**LangGraph state/checkpointer** serves as execution recovery medium only; canonical state is always written back to workspace (`current-context/tasks/review/artifacts/audit`).

### Workspace Modes

- `tool_managed` (default): workspace at `~/.repo-ai-governor/workspaces/<repo_fingerprint>/`
- `repo_local`: workspace at `<repo>/.repo-ai-governor/`

Configured in `.repo-ai-governor/governor.yaml`.

### Test Topology (CS-024)

- `apps/**/test/` and `packages/**/test/` — package-scoped unit/contract tests
- `test/` root — cross-package integration, e2e, and contract tests
- Run `test:packages` and `test:integration` separately to preserve ownership boundaries

## Code Standards (Non-negotiable)

- **ESM imports**: all relative specifiers must use explicit `.js` extensions (e.g., `./foo.js`)
- **No native `Error`**: use standardized errors from `packages/shared/src/errors/` (`BaseError`, `ConfigError`, `RuntimeError`, `GovernorErrorCode`, `standardizeError`)
- **Type vs Interface**: `interface` for object structure contracts; `type` for unions/literals/mapped/composed types. Never `type Xxx = { ... }` for object shapes without `// type-shape-allowed: reason`
- **Type file layout**: `src/types/interfaces/*.interface.ts` and `src/types/aliases/*.type.ts` with `index.ts` barrels
- **Finite sets**: enums/constants in `src/constants/` — no inline closed string-literal union aliases
- **No dynamic imports** unless annotated `// dynamic-import-allowed: reason`
- **OOP for domain modules**: classes/services for runtime/workflow/policy/adapter domains; pure helpers may be function-style with `// oop-function-allowed: reason`
- **One class per file** in domain modules; exceptions require `// class-collocation-allowed: reason`
- **Conventional Commits** for all commit messages
- **JSDoc required** for all exported classes/functions in `src/**` and `packages/**`

## Governance Context

Before planning or executing work, read:
- `.repo-ai-governor/context/current-context.md` — active project/sprint/stream state
- `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml` — which normative documents to load and when

The normative loading manifest is the single source of truth for document loading tiers (L0/L1/L2). Only load L1/L2 documents when the task matches their `load_trigger`.

Key normative docs:
- `product-requirements-brief.md` — default execution target (L0)
- `governance/code_standards.md` — non-negotiable rules + verification commands (L0)
- `governance/long-term-maintenance-guide.md` — maintenance guidance (L0)
- `repo-ai-governor-overall-technical-solution.md` — runtime contracts (L1, load on architecture/runtime changes)
- `repo-ai-governor-architecture-and-repo-layering.md` — module dependency constraints (L1, load on layering changes)

## Repository-local Skills

Repository-local skills live under `.codex/skills/`. When a task clearly matches one of these workflows, read the corresponding `SKILL.md` before executing:

- `.codex/skills/technical-solution-promotion/SKILL.md`
- `.codex/skills/workspace-code-review-workflow/SKILL.md`
- `.codex/skills/workspace-delivery-finisher/SKILL.md`

## Context & Review Workflow

Task and sprint ledgers live under `.repo-ai-governor/context/dev/<project-xxx>/sprint-xxx/tasks/`:
- `plan.md`, `checklist.md`, `tasks.csv`, `TK-xxx.md` per task

Code review lifecycle artifacts live in `sprint-xxx/review/`:
- `code_review_<slug>.md` → `verified_code_review_<slug>.md` → `resolved_code_review_<slug>.md`

Task/sprint/review statuses must stay synchronized (CS-021, CS-026) — drift blocks delivery.
