---
name: workspace-task-decomposition
description: Repository-local workflow for decomposing work into standardized `project/sprint/task` execution surfaces in this workspace. Use when the user says "任务拆解", "拆 project/sprint/task", "初始化执行流", "按模板生成 plan", "补 project/sprint/task 骨架", or otherwise wants a repo-governed scaffold for project plans, sprint plans, task cards, checklist, and tasks.csv.
---

# Workspace Task Decomposition

## Overview

Use this repository-local skill when the user wants to:

1. create a new `project-xxx / sprint-xxx / tasks / review` execution surface
2. decompose a request into standardized `TK/CR` task cards
3. normalize an existing project or sprint plan back to the repo template
4. bootstrap `checklist.md` / `tasks.csv` / `review/.gitkeep` so the stream is execution-ready

Prefer this skill over ad-hoc plan writing whenever the request is about task decomposition, execution-stream initialization, or project/sprint/task template normalization in this repository.

## Trigger Mapping

1. `任务拆解` / `拆 project sprint task`
- Interpret as `decompose-scope`.

2. `初始化执行流` / `新建 project/sprint/task 骨架`
- Interpret as `bootstrap-stream`.

3. `按模板生成 plan` / `补 plan 模板`
- Interpret as `normalize-plans`.

4. `补 checklist/tasks.csv/task 卡骨架`
- Interpret as `repair-scaffold`.

## Required Inputs

Read these before doing anything else:

1. `AGENTS.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
7. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
8. `.repo-ai-governor/normative_knowledge_sources/governance/execution-stream-scaffold-template.md`
9. `.repo-ai-governor/normative_knowledge_sources/governance/project-plan-template.md`
10. `.repo-ai-governor/normative_knowledge_sources/governance/sprint-plan-template.md`
11. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`
12. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
13. `scripts/governance/reserve-task-id.js`
14. `scripts/governance/sync-task-ledger.js`
15. `scripts/governance/query-artifact-candidates.js`
16. `scripts/governance/check-task-required-inputs.js`
17. `.codex/skills/workspace-code-review-workflow/SKILL.md`（当拆解结果包含 CR workflow 时）

## Phase 1: Resolve Mode And Canonical Output Path

1. Resolve the requested mode:
- `decompose-scope`
- `bootstrap-stream`
- `normalize-plans`
- `repair-scaffold`

2. Resolve the canonical output path:
- new stream under `.repo-ai-governor/context/dev/<project-xxx>/<sprint-xxx>/`
- existing project path already under `.repo-ai-governor/context/dev/**`
- existing sprint path already under `.repo-ai-governor/context/dev/**`
- when scope spans multiple sprints, resolve the full ordered sprint queue under one `project-xxx/`

3. Decide whether this turn should:
- only create or normalize the scaffold
- also activate the new stream in `current-context.md`

Default rule: if the user asked for decomposition/template initialization only, keep `current-context.md` unchanged unless the user explicitly asked to switch execution into the new stream.

## Phase 2: Build The Decomposition Contract

Always resolve at least:

1. `project id`
2. `project goal`
3. `ordered sprint queue`
4. `per-sprint goal`
5. `per-sprint in-scope TK items`

Add `CR` items when a sprint is expected to track code-review lifecycle in the ledger.

Before writing new task cards, resolve only the first-hop artifact inputs needed for decomposition:

1. query candidate DA artifacts from canonical registry instead of manually browsing the full DA corpus
2. keep `Required Inputs` narrow: prefer `1-3` direct DA / handoff inputs plus current sprint context
3. move historical plans, completion audits, superseded handoff notes, and extra background into `Traceback References`

Recommended candidate query:

```bash
node ./scripts/governance/query-artifact-candidates.js \
  --project project-097-meaningful-name \
  --task-title "implement core change" \
  --goal "完成本轮主要实现" \
  --limit 5
```

When the user gives a finalized technical solution or equivalent approved delivery baseline, default to full decomposition across the known sprint queue:

1. enumerate all in-scope sprints in execution order
2. assign `TK/CR` items for each sprint
3. scaffold every sprint in `planned` or explicitly requested status
4. keep activation incremental: only the first sprint becomes the default activation candidate unless the user explicitly wants multiple active streams

When the scope baseline is still incomplete or highly uncertain, fall back to the smallest safe first sprint:

1. one bootstrap / baseline task
2. one implementation or documentation task
3. one validation or closeout task

## Phase 3: Create Or Normalize The Scaffold

For net-new scaffolds:

1. create `project-xxx/plan.md`
2. create `sprint-xxx/plan.md`
3. create `sprint-xxx/tasks/`
4. create `sprint-xxx/review/.gitkeep`
5. reserve `TK` / `CR` ids with `reserve-task-id.js`
6. write canonical `TK/CR` task cards from the standard template
7. seed `checklist.md` and `tasks.csv` so the stream is human-readable immediately

Prefer the helper script:

```bash
node ./.codex/skills/workspace-task-decomposition/scripts/bootstrap-execution-scaffold.mjs \
  --project project-097-meaningful-name \
  --stage-mapping "delivery-governance" \
  --phase-mapping "task decomposition" \
  --project-goal "完成 project/sprint/task 执行流标准骨架。" \
  --project-goal "让后续执行直接衔接 plan/task-ledger/review surface。" \
  --sprint-spec "sprint-001-foundation|完成基础骨架、输入收敛与首轮执行准备|planned" \
  --sprint-spec "sprint-002-core-delivery|完成主要实现、验证与 CR 闭环|planned" \
  --sprint-spec "sprint-003-closeout|完成交付收口、审计摘要与后续 handoff|planned" \
  --sprint-scope "sprint-001-foundation|建立 project/sprint/task/review 标准执行面。" \
  --sprint-scope "sprint-002-core-delivery|承接方案主路径实现与验证。" \
  --sprint-scope "sprint-003-closeout|完成 closeout、completion audit 与交付收口。" \
  --task "sprint-001-foundation|bootstrap stream scaffold|P1|创建标准目录、plan 与 task ledger seed" \
  --task "sprint-001-foundation|prepare execution inputs|P1|收敛首跳 Required Inputs 与实施边界" \
  --task "sprint-002-core-delivery|implement core change|P1|完成本轮主要实现" \
  --task "sprint-002-core-delivery|verify and review delivery|P1|补齐验证并准备 review lifecycle" \
  --task "sprint-003-closeout|close sprint and project|P1|补齐 closeout 与 completion audit" \
  --task-input "sprint-002-core-delivery|implement-core-change|required|.repo-ai-governor/context/dev/project-096-previous-stream/sprint-004/tasks/DA-812-followup-handoff.md" \
  --task-input "sprint-002-core-delivery|implement-core-change|traceback|.repo-ai-governor/context/dev/project-096-previous-stream/project-096-completion-audit-summary.md"
```

Input assignment rules:

1. `--task-input` selector can be the exact task title or its slugified form.
2. In multi-sprint mode, `--task` / `--cr` / `--task-input` should start with the target `sprint-xxx` selector.
3. Legacy single-sprint invocation remains valid for targeted scaffold repair or one-sprint bootstrap.
4. Use `required` only for execution-entry inputs that should be read by default.
5. Use `traceback` for history, audit, extra handoff material, and overflow references that should not bloat default context.

When the request targets an existing stream:

1. normalize `project plan` against `project-plan-template.md`
2. normalize `sprint plan` against `sprint-plan-template.md`
3. normalize new task cards against `task-card-template.md`
4. repair `checklist.md` / `tasks.csv` drift through `sync-task-ledger.js`, not by freehand edits alone

## Phase 4: Canonicalize And Optionally Activate

Bootstrap seeds are not the end state. Before the stream is treated as the active execution surface:

1. run `node ./scripts/governance/sync-task-ledger.js --tasks-dir <...>`
2. run `node ./scripts/governance/check-task-ledger-sync.js`
3. run `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. if CR tasks were created, also run `node ./scripts/governance/check-code-review-status-sync.js`
5. when new task cards were created or normalized, run `node ./scripts/governance/check-task-required-inputs.js --tasks-dir <...>`

Only after that should you:

1. update `current-context.md`
2. if multiple sprints were scaffolded, mark only the first execution sprint as the primary active stream and keep the rest as planned follow-up streams
3. start actual implementation work

## Verification

Run the checks that match what changed:

1. When this skill changed:
- `python3 /Users/jimmydaddy/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/workspace-task-decomposition`

2. When governance templates or manifest changed:
- `node ./scripts/governance/run-normative-loading-manifest-gate.js`

3. When a real project/sprint scaffold was created or repaired in the repo workspace:
- `node ./scripts/governance/check-task-required-inputs.js --tasks-dir <...>`
- `node ./scripts/governance/check-task-ledger-sync.js`
- `node ./scripts/governance/check-sprint-plan-status-sync.js`
- `node ./scripts/governance/check-code-review-status-sync.js`（if CR tasks were involved）

4. When the change window only touches repo-local skills, governance templates, or planning docs:
- build is not required unless `apps/**`, `packages/**`, `bin/**`, or `test/**` changed in the same window

## Guardrails

1. Never skip `task-card-template.md` when generating new `TK/CR`.
2. Never treat `checklist.md` or `tasks.csv` as the only task truth.
3. Never activate a new stream in `current-context.md` before the user actually wants execution to move there.
4. Never reuse guessed task ids; reserve them first.
5. Never create `code_review_*` lifecycle files during pure decomposition/bootstrap.
6. Never mark a bootstrap-only stream as `completed` just because the scaffold exists; completion still requires real task execution and closeout artifacts.
7. Never manually browse every DA file just to fill a new task card; use `query-artifact-candidates.js` to narrow to a small candidate set first.
8. Never stuff all candidate DA into `Required Inputs`; keep only first-hop execution inputs there and move overflow to `Traceback References`.
9. Never silently collapse a finalized multi-sprint scope into only the first sprint; if the user supplied an approved full-scope baseline, decompose the full sprint queue unless they explicitly ask for a phased partial bootstrap.

## Result Template

Use this structure in the final response, adapted to the actual outcome:

1. `Mode`: `decompose-scope` / `bootstrap-stream` / `normalize-plans` / `repair-scaffold`
2. `Target`: project path + sprint path(s)
3. `Scaffold Outcome`: created / updated / normalized
4. `Ledger State`: seed-only / canonicalized
5. `Verification`: commands run + pass/fail
6. `Next Step`: activate first sprint / continue decomposition / start execution
