---
name: workspace-scoped-cr-loop
description: Repository-local workflow for executing a scoped task, sprint, or project with mandatory delegated code-review loops in this workspace. Use when the user asks to execute a specific task, sprint, or project and explicitly requires delegated CR loops such as “调起子 agent 做 CR，主 agent 复核并修复，再循环直到没有问题”, or otherwise wants fresh reviewer sub-agents after each review boundary until no actionable problem remains.
---

# Workspace Scoped CR Loop

## Overview

Use this skill when the user explicitly wants:

1. a specific `task`, `sprint`, or `project` executed to a clean state
2. a fresh reviewer sub-agent CR round after each review boundary
3. the main agent to verify findings, fix accepted issues, and rerun validation
4. repeated CR loops until no actionable problem remains
5. a final clean recheck before the target scope is considered complete

This workflow is repository-local. It must follow the current workspace truth for:

1. startup loading order from `AGENTS.md` and `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
2. review routing order: explicit report path -> `Worktree Review Target` -> active primary stream
3. CR lifecycle naming and `Status` synchronization
4. task ledger and sprint closeout synchronization

If the user does not explicitly ask for delegated review or sub-agent CR loops, do not force this skill.

## Trigger Signals

Prefer this skill when the user's request communicates this intent, regardless of exact wording:

1. execute a concrete `task`, `sprint`, or `project`, not just do one review pass
2. use reviewer sub-agents for CR, not only the main agent
3. let the main agent recheck findings, fix accepted items, and rerun verification
4. repeat the CR loop until the scope is clean, “没有问题”, “清零”, or “no actionable findings”

Typical wording may mention any combination of:

1. `执行某个任务 / 当前 sprint / 整个项目`
2. `调起子 agent 做 CR`
3. `主 agent 复核并修复`
4. `循环直到没有问题 / 直到清零`

## Required Inputs

Always load:

1. `AGENTS.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
7. `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
8. `.codex/skills/workspace-code-review-workflow/SKILL.md`

Load additional L1/L2 normative docs only when the task matches manifest `load_trigger`, or when the scope touches:

1. project/sprint closeout
2. task-ledger synchronization
3. artifact registry lifecycle
4. architecture/runtime contract changes
5. technical-solution promotion or delivery handoff

When you are about to spawn the reviewer sub-agent, also load:

1. `references/reviewer-subagent-prompt-template.md`
2. `scripts/render-reviewer-subagent-prompt.mjs`

## Ownership Split

The main agent owns:

1. resolving the scope and active stream
2. implementation and document changes
3. verification runs
4. writing or updating `TK-xxx` and `CR-xxx` records
5. writing canonical review artifacts in the resolved `review/` directory
6. rechecking reviewer findings and deciding `accepted / rejected / deferred`
7. fixing accepted findings
8. sprint closeout and project closeout

The reviewer sub-agent owns only the review pass:

1. inspect the current boundary scope
2. produce severity-ordered findings with evidence
3. highlight residual risks and missing tests
4. avoid code edits unless the user separately asks for delegated implementation

Use a fresh reviewer sub-agent for every CR round. Do not reuse a completed reviewer across rounds.

## Default Reviewer Configuration

When the user does not override reviewer settings, spawn the reviewer with:

1. model: `gpt-5.4`
2. reasoning effort: `xhigh`
3. role: `default`

This skill assumes the user already granted sub-agent permission by explicitly asking for delegated CR loops.

## Phase 1: Resolve Scope And Routing

Resolve the target boundary first:

1. `task` scope:
   - explicit `TK-xxx`
   - a specific task card path
   - a user request clearly narrower than a sprint
2. `sprint` scope:
   - explicit sprint id or sprint path
   - the active sprint in `current-context.md`
3. `project` scope:
   - explicit project id or project path
   - a user request to complete the remaining project

Then:

1. If the target scope is outside the active primary stream, update `current-context.md` first unless the user explicitly provided a canonical report path for a completed-stream CR tail.
2. Read the target scope's `plan.md`, `tasks/checklist.md`, `tasks/tasks.csv`, unresolved `TK-xxx.md`, and unresolved `CR-xxx.md`.
3. Resolve the review output path in this strict order:
   - user-specified report path or review directory
   - `## Worktree Review Target -> Review records`
   - `## Primary Stream -> Review records`
4. If `current-context.md` is `idle` and there is no `Worktree Review Target`, do not guess the review directory. Either:
   - activate the target stream first, or
   - require an explicit review path from the user
5. If the target is a project, build the remaining sprint queue in execution order.
6. If the target is a task, still resolve the containing sprint because canonical review artifacts and `CR-xxx` tracking belong to the enclosing sprint unless the user explicitly requests another canonical path.

## Phase 2: Execute The Boundary Before Review

Review starts only after the implementation work for the current boundary is complete.

1. For `task` scope:
   - finish the target task and directly required governance updates
   - sync task truth into `checklist.md` and `tasks.csv`
2. For `sprint` scope:
   - finish all remaining implementation and governance tasks required before sprint closeout
   - sync sprint task truth into `checklist.md` and `tasks.csv`
3. For `project` scope:
   - execute sprint by sprint
   - each sprint must finish implementation before entering that sprint's CR loop

Before starting review, run the relevant verification commands for the current boundary.

Do not start closeout for the current boundary yet. Review comes first.

## Phase 3: Boundary CR Loop

After the current boundary's implementation is complete, run this loop until a fresh review returns no actionable findings.

### Prompt Helper Script

Prefer using the helper script instead of hand-assembling the reviewer prompt:

```bash
node ./.codex/skills/workspace-scoped-cr-loop/scripts/render-reviewer-subagent-prompt.mjs \
  --tasks-dir <sprint-tasks-dir> \
  --scope-kind <task|sprint|project> \
  --scope-label <scope-id-or-label> \
  --round-type <initial|post-fix recheck|project-final> \
  --verification "pnpm run build" \
  --verification "pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1"
```

The helper will:

1. allocate the next available `CR-xxx`
2. derive the enclosing sprint label
3. resolve the canonical review directory from explicit `--review-dir` or `current-context.md`
4. generate a default `working-tree-YYYYMMDD-HHMM` report slug
5. render the reviewer prompt from the template

Use `--json` when you want machine-readable output.

### Copyable Chinese Invocation

When another AI tool or teammate needs a ready-to-paste natural-language invocation, use this:

```text
请使用 $workspace-scoped-cr-loop 执行这个范围，并强制走“子 agent 做 CR -> 主 agent 复核并修复 -> 再调新的子 agent 复查”的循环，直到没有 actionable findings 才结束。

目标范围：
- scope kind: sprint
- scope path: .repo-ai-governor/context/dev/<project-xxx>/<sprint-xxx>

执行要求：
1. 先完成该 sprint 范围内的实现、自检和必要的治理文档更新。
2. 每到一个 review 边界，都必须调起一个新的 reviewer 子 agent 做 CR，不要复用旧 reviewer。
3. 主 agent 负责逐条复核 findings，只修复 accepted 项，并补跑相关验证命令。
4. 每轮 CR 都要写入规范的 `code_review_* / verified_code_review_* / resolved_code_review_*` 生命周期文件，并同步 `CR-xxx`、`checklist.md`、`tasks.csv`。
5. review 输出路径按这个顺序解析：我显式给的路径 -> `Worktree Review Target` -> active primary stream。
6. 只有当最新一轮 reviewer 明确返回“没有 actionable findings”时，才允许结束当前 scope。
```

### Round Setup

1. Allocate the next available `CR-xxx` in the containing sprint `tasks/` directory.
2. Never reopen an already `resolved` CR task.
3. Create a new report slug for the current round.
4. Spawn a fresh reviewer sub-agent for the current boundary only.

### Reviewer Prompt Contract

Use `references/reviewer-subagent-prompt-template.md` as the default assembly template. Fill the exact scope, review directory, round metadata, and verification baseline instead of improvising the whole prompt.

Tell the reviewer:

1. review only the current boundary scope
2. use `AGENTS.md`, `current-context.md`, `normative-loading-manifest.yaml`, `product-requirements-brief.md`, `code_standards.md`, `long-term-maintenance-guide.md`, and `cr-lifecycle-threshold-spec.md` as baseline inputs
3. load additional manifest-triggered normative docs only when the boundary requires them
4. produce severity-ordered findings with file references and rule ids when applicable
5. avoid implementation edits
6. separate actionable findings from residual risks or weaker inference-based concerns

When building the prompt:

1. always name the exact target boundary and enclosing sprint
2. always tell the reviewer where the report must be written conceptually, even if the main agent performs the canonical write
3. always state whether the round is `initial`, `post-fix recheck`, or `project-final`
4. always list verification commands already run and commands expected after fixes
5. always remind the reviewer not to edit code, governance docs, or review artifacts

### Main-Agent Processing

After the reviewer returns:

1. write the round's `code_review_<slug>.md` into the resolved `review/` directory
2. create or update the matching `CR-xxx.md` task with status `review_pending`
3. recheck each finding yourself
4. append a dated recheck section with `accepted / rejected / deferred`
5. rename the report to `verified_code_review_<slug>.md`
6. update the report top-level `Status` to `verified` in the same change
7. move the `CR-xxx` task to `verified`

Then:

1. fix every `accepted` finding
2. document every real `deferred` item with blocker, owner, and follow-up window
3. rerun the relevant verification commands
4. append the fix record
5. rename the report to `resolved_code_review_<slug>.md`
6. update the report top-level `Status` to `resolved` in the same change
7. move the `CR-xxx` task to `resolved`

### Loop Exit Rule

If the next fresh reviewer finds new actionable issues:

1. allocate a new `CR-xxx`
2. start another round
3. do not reopen the old resolved CR

Exit the current boundary CR loop only when the latest fresh reviewer reports no actionable findings.

When the final recheck is clean, prefer writing that clean round directly as `resolved_code_review_<slug>.md` and mark the corresponding `CR-xxx` as `resolved`.

## Phase 4: Scope-Specific Exit

### Task Scope

After the target task's CR loop is clean:

1. mark the task complete and sync task ledgers
2. if the containing sprint now has all `TK` items `completed` and all `CR` items `resolved`, immediately execute sprint closeout
3. otherwise stop unless the user explicitly asked to continue to the broader sprint or project

### Sprint Scope

Only after all sprint `TK` items are `completed` and all sprint `CR` items are `resolved`:

1. execute sprint closeout
2. generate any sprint closeout artifact required by the plan
3. activate the next sprint if one exists
4. sync `plan.md`, `checklist.md`, `tasks.csv`, and any artifact registry updates required by the sprint

Do not leave a sprint in an all-done-but-not-closed state.

### Project Scope

For `project` scope, do not close the project after a single review. Use the project cadence below.

## Phase 5: Project Cadence

If the target scope is a `project`:

1. execute each remaining sprint in order
2. after each sprint implementation, complete that sprint's CR loop until clean
3. close out that sprint before advancing

After the last sprint's own CR loop is clean:

1. do not execute final project closeout yet
2. run one more fresh sub-agent review over the whole remaining project scope
3. process findings with the same `review_pending -> verified -> resolved` lifecycle
4. repeat with a fresh reviewer until the project-level review also returns clean

By default, store project-level final review rounds under the final sprint's resolved `review/` directory and consume the next available `CR-xxx` in that sprint's `tasks/` directory, unless the user specifies another canonical location.

## Phase 6: Final Project Closeout

If the target scope is a `project`, final closeout is allowed only after both conditions are true:

1. the final sprint CR loop is clean
2. the project-level final CR loop is clean

Then:

1. execute the project's final closeout task
2. generate the completion audit summary
3. generate handoff or freeze artifacts if required
4. update `current-context.md` and completed history as needed
5. sync artifact registry and task ledgers

## Verification Baseline

At minimum, rerun the concrete commands required by the touched scope.

1. For code-affecting changes under `apps/**`, `packages/**`, `bin/**`, or `test/**`, include:
   - `pnpm run build`
   - relevant package tests
   - relevant integration tests
   - any directly applicable governance checks from `code_standards.md`
2. For docs-only, ledger-only, or review-only changes, rerun the lifecycle and ledger checks that match the boundary:
   - `node ./scripts/governance/check-code-review-status-sync.js`
   - `node ./scripts/governance/check-task-ledger-sync.js`
   - `node ./scripts/governance/check-sprint-plan-status-sync.js`
   - `node ./scripts/governance/check-worktree-review-target.js` when `Worktree Review Target` is involved
3. Prefer explicit commands over `pnpm run check` inside the loop so the evidence stays boundary-specific and non-recursive.

## Guardrails

1. Never skip `current-context.md`; it is the routing truth for review output.
2. Never write CR artifacts outside the resolved canonical `review/` directory.
3. Never mark a report `resolved` while accepted fixes remain unfinished.
4. Never claim a command passed unless it actually ran successfully.
5. Never reopen a `resolved` CR task; allocate a new `CR-xxx` for each fresh round.
6. Never leave filename state and report `Status` out of sync.
7. Never claim “完成 / 全绿 / resolved” for code-affecting changes without one real `pnpm run build` in the same change window.
8. If a `Worktree Review Target` override was used and the target `review/` directory no longer contains `code_review_*` or `verified_code_review_*`, clear that override in `current-context.md` within the same workflow.
