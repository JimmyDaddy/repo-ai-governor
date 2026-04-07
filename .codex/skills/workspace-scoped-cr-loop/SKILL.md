---
name: workspace-scoped-cr-loop
description: Repository-local workflow for executing a scoped task, sprint, or project with mandatory delegated code-review loops and boundary-level local commits in this workspace. Use when the user asks to execute a specific task, sprint, or project and explicitly requires "调起子 agent 做 CR，主 agent 复核并修复，再循环直到没有问题".
---

# Workspace Scoped CR Loop

## Overview

Use this skill when the user explicitly wants:

1. a specific `task`, `sprint`, or `project` executed to a clean state
2. a fresh sub-agent CR round after each review boundary
3. the main agent to verify findings, fix accepted issues, and re-run validation
4. repeated CR loops until no actionable problem remains
5. a final clean recheck before the target scope is considered complete
6. a boundary-level local commit after each clean execution + CR cycle

If the user does not explicitly ask for delegated review or sub-agent loops, do not force this skill. Follow the normal project execution flow instead.

## Required Inputs

Always load:

1. `AGENTS.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
7. `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
8. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
9. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
10. `.codex/skills/workspace-code-review-workflow/SKILL.md`
11. `.codex/skills/workspace-delivery-finisher/SKILL.md`

Load additional normative docs required by `AGENTS.md` for the current scope, especially when sprint closeout, handoff, artifact updates, or task-ledger changes are involved.

When you are about to spawn the reviewer sub-agent, also load:

1. `references/reviewer-subagent-prompt-template.md`
2. `scripts/resume-or-bootstrap-cr-round.mjs`
3. `scripts/render-reviewer-subagent-prompt.mjs`
4. `scripts/bootstrap-cr-round.mjs`
5. `scripts/normalize-reviewer-findings.mjs`（当 reviewer 能提供 machine-readable findings 时）

Generated CR task cards and reviewer prompts should stay aligned with this baseline. If you customize required inputs, prefer adding scope-specific docs on top of the generated defaults instead of replacing them wholesale.

## Ownership Split

The main agent owns:

1. project and sprint execution planning
2. code and documentation changes
3. verification runs
4. writing or updating `CR-xxx` task cards
5. writing or updating review artifacts in the canonical `review/` directory
6. deciding whether findings are `accepted`, `rejected`, or `deferred`
7. fixing accepted findings
8. sprint closeout and next-sprint activation
9. final project closeout
10. boundary-level local commits after each clean execution + CR cycle

The sub-agent owns only the review pass:

1. inspect the scoped diff or working tree
2. surface risk-first findings with evidence
3. avoid code edits unless the user separately asks for delegated implementation work

Use a fresh sub-agent for every CR round. Do not reuse a completed reviewer across rounds.

## Default Reviewer Configuration

When the user does not override reviewer settings, spawn the reviewer with:

1. model: `gpt-5.4`
2. reasoning effort: `xhigh`
3. role: `default`

This skill assumes the user has explicitly allowed sub-agents by asking for delegated CR loops.

## Phase 1: Resolve Scope

Resolve the target unit first:

1. `task` scope:
   - explicit `TK-xxx`
   - a single task card path
   - a user request clearly narrower than a sprint
   - in this repo, task cards are often named `TK-xxx-<slug>.md`, so resolve by task-id prefix and fall back to a full task-card path when legacy duplicates exist
2. `sprint` scope:
   - explicit sprint path or sprint id
   - the active sprint in `current-context.md`
3. `project` scope:
   - explicit project path or project id
   - a user request to execute the whole remaining project

Then:

1. If the target is outside the active primary stream, update `current-context.md` first.
2. Read the target scope's `plan.md`, unresolved `TK-xxx.md` / `CR-xxx.md`, and the task-ledger surfaces required by the current repo truth model. In the current repo baseline this includes task cards, canonical task-ledger sqlite, and rendered `tasks/checklist.md` / `tasks/tasks.csv`.
3. If the target is a project, build the remaining sprint queue in execution order.
4. If the target is a task, resolve its containing sprint because review artifacts and `CR-xxx` task tracking still belong to the enclosing sprint unless the user explicitly requests another canonical path.

## Phase 2: Execute The Target Scope Before Review

Review only starts after the implementation work for the current boundary is finished.

1. For `task` scope:
   - finish the target task and any directly required governance updates
   - sync that task's truth through the current canonical task-ledger write path, then refresh any derived views
2. For `sprint` scope:
   - finish all remaining implementation and governance tasks required before sprint closeout
   - sync sprint task truth through the current canonical task-ledger write path, then refresh any derived views
3. For `project` scope:
   - execute sprint by sprint
   - each sprint must be fully implemented before entering that sprint's CR loop

Before starting review, run the relevant verification commands for the current boundary.

Do not start closeout for the current boundary yet. Review comes first.

### Task Ledger Mode Resolution

Before any ledger write-back, commit evidence suggestion, or closeout claim:

1. load `task-ledger-single-write-source-contract.md`
2. resolve the current repo truth model from that contract. In the current repo baseline, task cards remain the semantic source while sqlite is the canonical ledger truth.
3. do not treat checklist / `tasks.csv`-only edits as sufficient; write the canonical sqlite surface first, then refresh rendered or derived views
4. if docs and operational reality disagree, either:
   - use an explicit override for the current run and record the governance mismatch
   - or update governance before claiming the ledger is fully synced

## Phase 3: Boundary CR Loop

After the current boundary's implementation is complete, run this loop until a fresh review returns no actionable findings.

### Single-Command Entry Point

Prefer the single-command wrapper for normal CR rounds. It is the default ergonomic entrypoint because it keeps `--resume` and `--write-task-card` on by default, accepts `TK-xxx` / `sprint-xxx` / `project-xxx` or a concrete task/sprint/project path, and tries to infer the containing `tasks/` directory from `current-context.md` or the supplied scope path.

```bash
node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs

node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs \
  --scope TK-615 \
  --review-surface "apps/cli/src/commands" \
  --verification "pnpm run build"

node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs \
  --scope sprint-001-real-target-repo-adopter-pilot

node ./.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs \
  --scope project-055-ga-evidence-and-adopter-pilot-closeout
```

Use this wrapper when you want the main agent to remember only:

1. the target scope, if it is not the active sprint
2. any verification commands worth recording
3. optional `--review-surface` hints

Escalate to the lower-level bootstrap script only when you need to force advanced fields such as `--scope-kind`, `--scope-label`, `--scope-path`, `--cr-task-id`, `--report-slug`, or custom commit automation knobs.

### Round Bootstrap Script

Use the round bootstrap script for advanced/manual control. It remains the authoritative CR-round allocator and generates the next `CR-xxx`, suggested review artifact filenames, a task-card skeleton, and the reviewer prompt in one call.

```bash
node ./.codex/skills/workspace-scoped-cr-loop/scripts/bootstrap-cr-round.mjs \
  --tasks-dir <sprint-tasks-dir> \
  --scope-kind <task|sprint|project> \
  --scope-label <scope-id-or-label> \
  --review-surface "apps/cli/src/commands" \
  --round-type <initial|post-fix recheck|project-final> \
  --verification "pnpm run build" \
  --verification "pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1"
```

Useful flags:

1. `--json`: machine-readable output for agent orchestration
2. `--write-task-card`: write the generated `CR-xxx.md` skeleton into the sprint `tasks/` directory
3. `--cr-task-id <CR-xxx>`: reuse an already allocated CR id instead of auto-allocating again
4. `--review-surface "<path-or-slice>"`: narrow reviewer attention to exact paths or boundary slices inside the declared scope; repeatable
5. `--depends-on`, `--required-input`, `--traceback`, `--implementation-step`: override or enrich the generated task-card content
6. `--suggest-commit`: emit a boundary commit plan, including gate, stage command, and commit command
7. `--auto-commit`: run the boundary local commit when the staging scope is explicit and safe
8. `--commit-path <path>`: declare the paths owned by the current boundary; repeatable and recommended for `--auto-commit`
9. `--commit-all`: explicitly allow the boundary commit to stage the full working tree
10. `--pre-commit-gate "<command>"`: override the default pre-commit gate, which is `pnpm run check`
11. `--task-ledger-mode <contract-default|tk-plus-derived-ledgers|sqlite-canonical>`: control how commit evidence suggestions describe canonical ledger write-back; default is `contract-default`
12. `--help`: print CLI usage and exit

The bootstrap result includes:

1. `CR-xxx` task id
2. suggested `code_review_* / verified_code_review_* / resolved_code_review_*` paths
3. generated task-card markdown
4. reviewer sub-agent prompt
5. suggested local commit message for the current boundary
6. when requested, a commit readiness analysis or an actual local commit result
7. resolved review surface for the reviewer
8. when a boundary commit succeeds, canonical task-ledger write-back suggestions keyed to the resolved task-ledger mode
9. generated CR task-card metadata that persists `Scope Kind / Scope Label / Round Type` for reliable resume matching

Treat `bootstrap-cr-round.mjs` as the authoritative CR-round allocator. If you later need to re-render the reviewer prompt separately, pass through the returned `--cr-task-id` and `--report-slug` instead of allocating a second time.

### Prompt Helper Script

Prefer using the helper script instead of hand-assembling the reviewer prompt:

```bash
node ./.codex/skills/workspace-scoped-cr-loop/scripts/render-reviewer-subagent-prompt.mjs \
  --tasks-dir <sprint-tasks-dir> \
  --scope-kind <task|sprint|project> \
  --scope-label <scope-id-or-label> \
  --cr-task-id <CR-xxx-from-bootstrap> \
  --report-slug <slug-from-bootstrap> \
  --review-surface "apps/cli/src/commands" \
  --round-type <initial|post-fix recheck|project-final> \
  --verification "pnpm run build" \
  --verification "pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1"
```

The helper will:

1. reuse the supplied `CR-xxx` / report slug when provided, otherwise auto-allocate defaults
2. derive the enclosing sprint label and canonical `review/` directory
3. render the reviewer prompt from the reference template
4. include the declared review surface so the sub-agent stays inside the intended boundary
5. emit the structured delegated reviewer handoff contract alongside the rendered prompt so the prompt remains a transport view rather than the only fact source

Use `--json` when you want machine-readable output for the next orchestration step.

Preferred pattern:

1. start with `resume-or-bootstrap-cr-round.mjs` unless you truly need manual scope metadata control
2. keep the returned `CR_TASK_ID` and `REPORT_SLUG`
3. if you later call `render-reviewer-subagent-prompt.mjs`, pass both back explicitly
4. fall back to `bootstrap-cr-round.mjs` only for advanced/manual orchestration
5. when the reviewer can return machine-readable findings, normalize them through `normalize-reviewer-findings.mjs` before merging them back into the main-agent triage flow

For commit automation:

1. `--suggest-commit` is safe by default and never changes git state
2. `--auto-commit` will refuse to run unless either:
   - `--commit-path` narrows the stage scope and no outside changes remain
   - `--commit-all` was explicitly supplied
3. `--auto-commit` creates a local commit only; push remains opt-in and outside this skill's default flow
4. when operational reality differs from current governance docs, use `--task-ledger-mode sqlite-canonical` only as an explicit temporary override and repair the governance contract separately

### Round Setup

1. Allocate the next available `CR-xxx` in the containing sprint `tasks/` directory.
2. Never reopen an already `resolved` CR task.
3. Create a new review report slug for the current round.
4. Spawn a fresh reviewer sub-agent for the current boundary only.
5. When a helper has already allocated the round id, do not run a second allocator for the same round; reuse the existing `CR-xxx` and `report_slug`.
6. Fresh auto-allocation should happen through the reservation-aware helper path so concurrent allocators cannot silently claim the same `CR-xxx`.
7. Generated or hand-maintained CR task cards should preserve `Scope Kind / Scope Label / Round Type` metadata so future `--resume` can match the intended boundary exactly.

### Reviewer Prompt Contract

Use `references/reviewer-subagent-prompt-template.md` as the default assembly template. Fill in the concrete scope, review directory, round number, report slug, and verification baseline instead of improvising the whole reviewer prompt from scratch.

Tell the reviewer:

1. review only the current boundary scope
2. use `AGENTS.md`, `current-context.md`, `normative-loading-manifest.yaml`, `product-requirements-brief.md`, `code_standards.md`, `cr-lifecycle-threshold-spec.md`, `long-term-maintenance-guide.md`, `task-ledger-single-write-source-contract.md`, and `execution-gate-layering-spec.md` as the baseline
3. produce severity-ordered findings with file references and rule ids when applicable
4. avoid implementation edits
5. call out residual risks and missing tests separately from hard findings
6. prioritize the supplied review surface and avoid drifting into unrelated files

Keep the prompt concrete: mention task, sprint, or project scope; intended review directory; and whether the review is an initial pass or a post-fix recheck.

When building the prompt:

1. always name the exact target boundary and enclosing sprint
2. always tell the reviewer where the report must be written conceptually, even if the main agent will perform the final canonical write
3. always state whether the round is `initial`, `post-fix recheck`, or `project-final`
4. always list the verification commands already run and any commands the reviewer should expect to see rerun after fixes
5. always remind the reviewer not to edit code or governance files
6. when the boundary is narrower than the full scope root, always pass `--review-surface` entries for the touched paths or owned modules

### Main-Agent Processing

After the reviewer returns:

1. write the round's `code_review_<slug>.md` into the sprint `review/` directory
2. create or update the matching `CR-xxx.md` task with status `review_pending`
3. recheck each finding yourself
4. append a dated recheck section with `accepted / rejected / deferred`
5. rename to `verified_code_review_<slug>.md`
6. move the `CR-xxx` task to `verified`

Then:

1. fix every `accepted` finding
2. document any true `deferred` item with blocker and follow-up window
3. rerun the relevant verification commands
4. append the fix record
5. rename to `resolved_code_review_<slug>.md`
6. move the `CR-xxx` task to `resolved`

### Loop Exit Rule

If the next fresh reviewer finds new actionable issues:

1. allocate a new `CR-xxx`
2. start another round
3. do not reopen the old resolved CR

Exit the current boundary CR loop only when the latest fresh reviewer reports no actionable findings.

When the final recheck is clean, prefer writing the clean round directly as a resolved review artifact and mark that round's `CR-xxx` as `resolved`.

### Resume Protocol

If execution is interrupted mid-boundary, do not blindly allocate a new `CR-xxx`. Resume in this order:

1. reload `current-context.md`, the target `plan.md`, sprint `tasks/`, and sprint `review/`
2. inspect the latest non-resolved `CR-xxx` task in the owning sprint
3. inspect any active reservation under `tasks/.cr-round-reservations/`
4. only allocate a brand-new `CR-xxx` when there is no matching open round and no matching active reservation for the current boundary

Round-state interpretation:

1. if the latest matching `CR-xxx` is still `review_pending`, resume that round's review verification and do not create a new CR
2. if the latest matching `CR-xxx` is `verified`, resume accepted-finding fixes and post-fix validation for that same round
3. if the latest matching `CR-xxx` is already `resolved`, only create a new round when you are intentionally launching a fresh recheck
4. if there is no task card yet but there is an active reservation, reuse that reservation's `CR-xxx` and `report_slug`
5. resume matching should prefer exact `Scope Kind / Scope Label / Round Type` metadata; only use legacy fallbacks for older cards that predate these fields
6. task-scope resume should resolve `TK-xxx` against slug-suffixed task cards when needed; if multiple legacy matches exist, require an explicit task-card path

Tooling guidance:

1. prefer `bootstrap-cr-round.mjs --resume` when resuming a boundary
2. if bootstrap already produced a round id and slug, pass them through to any later helper call via `--cr-task-id` and `--report-slug`
3. `tasks/.cr-round-reservations/` is a hidden coordination surface for in-flight round ids; do not hand-edit it unless you are intentionally clearing a stale reservation
4. a normal `--write-task-card` flow should consume and release the matching reservation automatically
5. when `--resume` reuses an existing task card, `--write-task-card` should be treated as an idempotent no-op instead of failing

Resume exit rule:

1. do not advance to boundary commit, sprint closeout, or project closeout until the resumed round itself reaches a clean terminal state
2. if resume inspection reveals conflicting open rounds for the same boundary, pause and reconcile before continuing

## Phase 4: Boundary Commit

After the current boundary's execution work is done and its CR loop is clean, create one local commit before moving on to the next boundary.

This commit step is mandatory for this skill unless one of the explicit skip conditions below applies.

### Commit Rules

1. default to local commit only; do not push unless the user explicitly asks
2. follow the guardrails from `workspace-delivery-finisher`
3. do not amend prior commits unless the user explicitly asks
4. if the working tree has no changes for this boundary, record that no commit was needed and continue
5. if unrelated concurrent changes exist, commit only the boundary-owned files when that separation is safe; otherwise pause and realign with the user

### Commit Gate

Before the boundary commit:

1. ensure the boundary's `Delivery Verification` is already green
2. rerun `pnpm run check` as the repository-level delivery sanity gate
3. stop if the gate fails

Interpretation:

1. the boundary-specific tests/build/evidence remain the primary release proof
2. the extra `pnpm run check` is the final pre-commit repo sanity pass

### Commit Granularity

1. `task` scope:
   - after the task's CR loop is clean
   - if the task completion also triggered sprint closeout in the same boundary, commit after the closeout write-back finishes
2. `sprint` scope:
   - after sprint closeout and activation write-backs complete
   - commit before starting the next sprint's implementation
3. `project` scope:
   - after each sprint reaches clean closeout, create a sprint commit
   - after the final project-level CR loop is clean and final closeout completes, create one final project commit

### Commit Message Guidance

Prefer Conventional Commits that reflect the current boundary:

1. implementation-heavy boundary:
   - `feat(<scope>): ...`
   - `fix(<scope>): ...`
2. governance / closeout / handoff heavy boundary:
   - `docs(<scope>): ...`
   - `chore(<scope>): ...`

Recommended subjects:

1. task:
   - `<type>(TK-194): complete task and clear cr loop`
2. sprint:
   - `<type>(project-012-sprint-003): complete sprint and clear cr loop`
3. project:
   - `<type>(project-012): complete project and clear final cr loop`

Use the suggestion emitted by `bootstrap-cr-round.mjs` when it matches the actual boundary changes.

## Phase 5: Scope-Specific Exit

### Task Scope

After the target task's CR loop is clean:

1. mark the task complete and sync task ledgers
2. if the containing sprint now has all `TK` items `completed` and all `CR` items `resolved`, immediately execute sprint closeout
3. otherwise stop unless the user explicitly asked to continue to the broader sprint or project

### Sprint Scope

Only after all sprint `TK` items are `completed` and all sprint `CR` items are `resolved`:

1. execute the sprint closeout task
2. generate any sprint closeout artifact required by the plan
3. activate the next sprint if one exists
4. sync `plan.md`, canonical task-ledger sqlite, rendered `checklist.md` / `tasks.csv`, and any artifact registry updates required by the sprint

Do not leave a sprint in an all-done-but-not-closed state.

### Project Scope

For `project` scope, do not close the project after a single review. Use the project cadence below.

## Phase 6: Project Cadence

If the target scope is a `project`:

1. execute each remaining sprint in order
2. after each sprint implementation, complete that sprint's CR loop until clean
3. close out that sprint before advancing
4. create the sprint-level local commit before starting the next sprint

After the last sprint's own CR loop is clean:

1. do not execute final project closeout yet
2. run one more fresh sub-agent review over the whole remaining project scope
3. process findings with the same `review_pending -> verified -> resolved` lifecycle
4. repeat with a fresh reviewer until the project-level review also returns clean

By default, store the final project-level review rounds under the final sprint's `review/` directory and consume the next available `CR-xxx` in that sprint's `tasks/` directory, unless the user specifies another canonical location.

## Phase 7: Final Project Closeout

If the target scope is a `project`, final closeout is allowed only after both conditions are true:

1. the final sprint CR loop is clean
2. the project-level final CR loop is clean

Then:

1. execute the project's final closeout task
2. generate the completion audit summary
3. generate handoff or freeze artifacts if required
4. update `current-context.md` and completed history as needed
5. sync artifact registry and task ledgers
6. create the final project local commit before declaring the project complete

## Verification Baseline

At minimum, rerun the commands required by the touched scope. For code changes under `apps/**`, `packages/**`, `bin/**`, or `test/**`, include:

1. `pnpm run build`
2. relevant package tests
3. `node ./scripts/governance/sync-task-ledger.js --task-id <TK-xxx|CR-xxx>` or the `--tasks-dir <sprint/tasks>` variant
4. governance sync checks required by the sprint

When the active plan defines fixed verification commands, treat those as the round baseline and rerun them after accepted fixes.

## Guardrails

1. Never let the reviewer sub-agent own canonical governance writes. The main agent must update repository truth.
2. Never mark a CR `verified` or `resolved` without matching filename, top-level `Status`, and `CR-xxx` task status.
3. Never close out a sprint while any `CR-xxx` in that sprint is not `resolved`.
4. Never perform final project closeout before the project-level final CR loop is clean.
5. For project scope, do not merge sprint review loops together; each sprint must independently reach a clean state first.
6. Use new `CR-xxx` identifiers per round instead of recycling resolved CR tasks.
7. If a reviewer concern is weak or unsupported by standards, record it as rejected or risk-based inference instead of silently accepting it.
8. Keep the main agent on the critical path: sub-agents review, main agent decides and integrates.
9. Do not push as part of the automatic boundary commit unless the user explicitly asked for push behavior.
10. Do not skip the boundary commit just because a later sprint or project commit will exist; every clean boundary should have its own local checkpoint when changes exist.

## Quick Invocation Patterns

This skill should trigger for requests like:

1. `执行 TK-201，并且做子 agent CR 循环直到清零`
2. `执行当前 sprint，并在 sprint 结束后循环 CR 直到没有问题`
3. `把这个项目从当前 sprint 一直执行到结束，每个 sprint 和最终项目都要循环 CR 直到清零`
