---
name: technical-solution-promotion
description: Repository-local workflow for promoting a technical solution from `.repo-ai-governor/draft/**` into formal lifecycle-managed module docs in this workspace. Use when the user says "提升技术方案", "把 draft 变正式", "promote technical solution", "审核通过后转正式", "正式化技术方案", or otherwise wants to check promotion readiness, perform an approved promotion, or supersede an existing active solution.
---

# Technical Solution Promotion

## Overview

Use this repository-local skill to execute technical solution promotion in a controlled way. The skill does not approve a solution by itself and does not create a new source of truth. It projects the existing repository governance into a repeatable workflow: inspect readiness, promote approved content into formal module docs, update lifecycle/module/manifest/delivery-handoff/rollout state, run gates, and close the active sprint records.

Prefer this skill over generic document-editing workflows whenever the request is about moving a technical solution from `draft` to formal usable status in this repository.

## Trigger Mapping

1. `提升技术方案` / `把 draft 变正式` / `promote technical solution`
- Interpret as `prepare-promotion` first unless the user explicitly says the review is already approved and wants the formal cutover now.

2. `审核通过后转正式` / `promote approved solution`
- Interpret as `promote-approved-solution`.
- Require review evidence and lifecycle readiness before writing `final_paths`.

3. `废弃旧正式方案` / `supersede active solution`
- Interpret as `supersede-active-solution`.
- Keep historical traceability by updating lifecycle metadata instead of deleting the old solution.

## Required Inputs

Read these before doing anything else:

1. `AGENTS.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
7. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
8. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
9. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

Then load only the specific draft file, module docs, review artifacts, and triad docs required by the requested promotion.

## Workflow A: `prepare-promotion`

Use this mode when the user wants a readiness check or has not explicitly said the review is already approved.

1. Resolve the target solution.
- Find the lifecycle entry by `solution_id`, `draft_paths`, or the user-provided draft file.
- If no lifecycle entry exists, create one in the active sprint before proceeding.

2. Check readiness.
- Confirm the draft file exists under `.repo-ai-governor/draft/**`.
- Confirm the solution has a review path or ask the user to generate/reuse one through the active sprint review flow.
- Confirm the target module is known or can be added safely to `technical-solution-module-registry.yaml`.
- Decide whether the promotion touches only module docs or also triad/architecture boundaries.

3. Return a concrete promotion plan.
- Expected `final_paths`
- Required registry updates
- Required delivery handoff mode (`docs_only | existing_stream | followup_required`)
- Required consumer/rollout ownership (`consumer_surfaces`, `user_impact_level`, `rollout_status`, `rollout_artifacts`)
- Required review/artifact/task updates
- Required gates

4. Do not set `final_paths` or `status: active` in this mode.

## Workflow B: `promote-approved-solution`

Use this mode only when review approval is explicit and evidence already exists.

1. Confirm approval preconditions.
- A lifecycle entry exists.
- At least one `review_paths[]` item exists and matches the approved scope.
- The requested promotion will not bypass `lifecycle registry -> module registry -> manifest -> gate`.

2. Materialize the formal docs.
- Do not edit the draft in place into a final doc.
- Create or update the formal module docs under:
  - `technical-solutions/<module>/module-overview.md`
  - `technical-solutions/<module>/contracts/*.md`
  - `technical-solutions/<module>/adrs/*.md` when needed

3. Update the canonical governance surfaces in this order.
- `technical-solution-lifecycle-registry.yaml`
- `technical-solution-delivery-registry.yaml`
- `technical-solution-module-registry.yaml` when module facts are impacted
- `normative-loading-manifest.yaml`
- triad or architecture docs only when the change hits north-star/layering/global contracts
- active sprint `plan.md`, `tasks/checklist.md`, `tasks/tasks.csv`, `TK-xxx.md`, `DA-xxx.md`, `review/`
- `context/artifact-registry/artifacts.csv`

4. Lifecycle state rules.
- `draft` or `review_pending` may move directly to `active` in the same change set when approval evidence exists and the final docs are fully wired.
- `approved` is allowed as a staging status only when no `final_paths` have been written yet.
- Never register `draft_paths` in manifest.

5. Run the required gates.
- `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
- `node ./scripts/governance/check-technical-solution-delivery-registry.js`
- `node ./scripts/governance/check-technical-solution-module-graph.js`
- `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
- `node ./scripts/governance/check-docs-triad-sync.js`
- `node ./scripts/governance/check-task-ledger-sync.js`
- `node ./scripts/governance/check-sprint-plan-status-sync.js`
- `node ./scripts/governance/check-code-review-status-sync.js`
- `node ./scripts/governance/check-artifact-registry-lifecycle.js`
- `pnpm -s tsc -p tsconfig.json --noEmit` when code or gate scripts changed

6. Only report success when all required gates pass.

## Workflow C: `supersede-active-solution`

Use this when a new formal solution replaces an older formal one.

1. Promote the new solution first using Workflow B.
2. Update the replaced lifecycle entry:
- `status: superseded`
- `superseded_by: <new-solution-id>`
- retain historical `final_paths`

3. Do not delete historical docs unless the user explicitly requests archival cleanup and the lifecycle policy allows it.

## Guardrails

1. Never treat a draft file as a formal source of truth.
2. Never mark a solution `active` without review evidence.
3. Never write `final_paths` for `draft` or `review_pending` entries.
4. Never register `.repo-ai-governor/draft/**` paths in manifest.
5. Never leave an `active` technical solution without delivery ownership and consumer/rollout metadata.
6. Never skip lifecycle/module/manifest/delivery synchronization just because the docs look small.
7. Never claim a promotion succeeded if the gates failed.
8. Never overwrite previous completion audits; each reopen/closeout must create a new audit artifact.

## Result Template

Use this structure in the final response, adapted to the actual outcome:

1. `Mode`: `prepare-promotion` / `promote-approved-solution` / `supersede-active-solution`
2. `Target`: solution id + draft path or module id
3. `Updated Facts`: lifecycle registry / module registry / manifest / formal docs
4. `Verification`: commands run + pass/fail
5. `Blockers`: only when promotion could not complete

## Portable Prompt

When another AI surface cannot load skill folders, paste this prompt directly:

```text
你是当前仓库的技术方案 promotion 助手。严格执行：1）先读 AGENTS.md、current-context、normative-loading-manifest、code_standards、long-term-maintenance-guide、technical-solution-lifecycle-registry、technical-solution-module-registry；2）先判断是 prepare-promotion、promote-approved-solution 还是 supersede-active-solution；3）draft 只能留在 .repo-ai-governor/draft/**，不能进入 manifest；4）正式化时按 lifecycle registry -> module registry -> manifest -> formal docs -> sprint ledger/review/artifact 的顺序更新；5）必须运行 lifecycle/module-graph/manifest/docs-triad/task-ledger/sprint-status/code-review/artifact gates，必要时再跑 tsc；6）没有 review evidence 或 gate 未通过时，禁止声称 promotion 完成。
```
