---
name: technical-solution-review
description: Repository-local workflow for reviewing draft technical solutions in this workspace before promotion. Use when the user says "评审方案", "review 技术方案", "帮我 review draft", "判断这个方案能不能过审", "复核方案修改后是否可以批准", or otherwise wants to move a draft technical solution from `draft`, through `review_pending`, to `approved` with explicit review evidence and promotion handoff.
---

# Technical Solution Review

## Overview

Use this skill to run the repository's technical-solution review loop in a controlled way. It complements `technical-solution-promotion`: this skill owns `draft -> review_pending -> approved`, while promotion owns `approved -> active/superseded` formal cutover.

## Trigger Mapping

1. `评审方案` / `review 技术方案` / `帮我 review draft`
- Interpret as `review-draft-solution`.

2. `复核方案修改后是否可以通过` / `re-review this solution`
- Interpret as `re-review-after-updates`.

3. `这个方案能不能批准` / `approve this reviewed solution`
- Interpret as `approve-reviewed-solution`.

4. `先看看这个方案是否 ready` / `check review readiness`
- Interpret as `prepare-review`.

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
9. `.codex/skills/technical-solution-promotion/SKILL.md`

Load only the specific draft file, prior review artifacts, affected module docs, and manifest-triggered L1/L2 docs required by the requested review. When the user explicitly asks for looped delegated re-review, use `.codex/skills/workspace-scoped-cr-loop/SKILL.md` as the structural reference for fresh-round review discipline, but keep lifecycle decisions in this workflow.

## Phase 1: Resolve Target And Review Surface

1. Resolve the target solution by `solution_id`, `draft_paths`, review artifact path, or explicit draft file.
2. Locate the lifecycle entry in `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`.
- If no entry exists, create one in the active sprint before starting review.
- Keep draft content under `.repo-ai-governor/draft/**`; never register draft files in manifest.
3. Resolve the review output path.
- Prefer a user-specified review path when provided.
- Otherwise use the active primary stream `review/` directory from `current-context.md`.
- If an existing review artifact already covers the same solution and round, update that artifact instead of creating parallel truth.
4. Determine the review mode:
- `prepare-review`
- `review-draft-solution`
- `re-review-after-updates`
- `approve-reviewed-solution`
5. If the solution touches triad docs, layer boundaries, runtime contracts, or module graph edges, load the corresponding manifest-triggered L1/L2 docs before making approval claims.

## Phase 2: Build Review Baseline Before Commenting

1. Read the draft, lifecycle entry, prior review artifacts, target module docs, and declared `north_star_refs`.
2. Compare the draft against:
- product-goal alignment from `product-requirements-brief.md`
- lifecycle/module boundaries from the registry and module overview docs
- existing `active` or `superseded` solutions covering the same topic
- expected promotion path when the user already intends to formalize the solution next
3. Separate three output classes clearly:
- blocking issues that prevent approval
- non-blocking improvement suggestions
- promotion-preparation notes that should be handled later by `technical-solution-promotion`
4. If review conclusions depend on outside facts or vendor docs, mark them as supplemental evidence and do not override repository truth.

## Phase 3: Run The Solution Review Loop

Repeat review rounds until one round is clean or the user pauses the work.

1. Use one canonical artifact path per round.
2. Default artifact lifecycle:
- `solution_review_<slug>.md` with `Status: review_pending`
- `verified_solution_review_<slug>.md` with `Status: verified`
- `approved_solution_review_<slug>.md` with `Status: approved`
3. If the repo already has a review artifact for the same solution, evolve that artifact instead of creating siblings with overlapping scope.
4. The initial review must record:
- reviewed draft path and `solution_id`
- affected module ids or boundary areas
- findings ordered by severity
- explicit `approved / changes_required / deferred` verdict
- blocking vs non-blocking split
- evidence references and needed follow-up
5. When the draft is revised, re-review the same artifact:
- append dated disposition for each prior finding
- mark `accepted / rejected / deferred`
- record the evidence used to decide each disposition
- rename to `verified_solution_review_<slug>.md` only after every blocking issue has a clear disposition
6. Move to `approved_solution_review_<slug>.md` only when:
- no blocking findings remain
- any deferred items are explicitly non-blocking with owner and target window
- the lifecycle entry can move to `approved` without also writing `final_paths`
7. If the user explicitly asks for delegated reviewer help, you may borrow the fresh-round review pattern from `workspace-scoped-cr-loop`, but the main agent must still own the artifact write-back, lifecycle status, and approval decision.

## Phase 4: Write Lifecycle State And Promotion Handoff

1. `prepare-review`
- Create a missing lifecycle entry when needed.
- Keep status as `draft`.
- Do not add `review_paths` until an actual review artifact exists.

2. `review-draft-solution` or `re-review-after-updates`
- Set or keep lifecycle status at `review_pending`.
- Maintain `draft_paths`.
- Add the current canonical review artifact path to `review_paths`.

3. `approve-reviewed-solution`
- Update lifecycle status to `approved`.
- Fill `approved_at` and `approved_by`.
- Keep `final_paths` empty.
- Hand off to `technical-solution-promotion` for the later formal cutover.

4. Never mark a solution `active` in this workflow.
5. Never update `technical-solution-delivery-registry.yaml` here unless the user explicitly asks for promotion planning or formal cutover work.

## Review Artifact Contract

Every technical-solution review artifact should include these minimum fields near the top:

1. `Status`
2. `Date`
3. `Scope` or `Solution ID`
4. `Draft Path`
5. `Reviewer`
6. `Verdict`
7. `Related Lifecycle Entry`

Recommended body sections:

1. `Review Scope`
2. `Blocking Findings`
3. `Non-Blocking Suggestions`
4. `Promotion Interlocks`
5. `Verification`
6. `Decision`

## Verification

Run the relevant checks for the surfaces you changed:

1. When lifecycle registry changed:
- `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`

2. When sprint plan or task ledger changed:
- `node ./scripts/governance/check-task-ledger-sync.js`
- `node ./scripts/governance/check-sprint-plan-status-sync.js`

3. When existing code-review lifecycle artifacts or `CR-xxx` task records were also touched:
- `node ./scripts/governance/check-code-review-status-sync.js`

4. When review/promotion work changed only draft docs, review artifacts, lifecycle metadata, or repo-local skills:
- build is not required unless `apps/**`, `packages/**`, `bin/**`, or `test/**` changed in the same change window

## Guardrails

1. Never treat a draft file as formal source of truth.
2. Never approve a solution without at least one concrete review artifact and explicit recheck evidence.
3. Never write `final_paths`, manifest entries, or `status: active` in this skill.
4. Never skip manifest-triggered L1/L2 docs when the review changes north-star, layering, module-graph, or runtime-contract conclusions.
5. Never keep multiple parallel review artifacts for the same round and scope.
6. Never approve while blocking findings remain unresolved.
7. Never delete historical review artifacts or previous lifecycle facts just because a newer review passed.
8. Remember the PRD rule: coding should not begin until the solution review is approved.

## Result Template

Use this structure in the final response, adapted to the actual outcome:

1. `Mode`: `prepare-review` / `review-draft-solution` / `re-review-after-updates` / `approve-reviewed-solution`
2. `Target`: solution id + draft path
3. `Review Outcome`: approved / changes_required / deferred
4. `Lifecycle Updates`: status + `review_paths` / `approved_at` changes
5. `Verification`: commands run + pass/fail
6. `Next Step`: revise draft / rerun review / hand off to `technical-solution-promotion`

## Portable Prompt

When another AI surface cannot load skill folders, paste this prompt directly:

```text
你是当前仓库的技术方案 review 助手。严格执行：1）先读 AGENTS.md、current-context、normative-loading-manifest、product-requirements-brief、code_standards、long-term-maintenance-guide、technical-solution-lifecycle-registry、technical-solution-module-registry、technical-solution-promotion skill；2）先判断是 prepare-review、review-draft-solution、re-review-after-updates 还是 approve-reviewed-solution；3）review 只负责 draft -> review_pending -> approved，不得直接写 final_paths 或 active；4）review artifact 默认走 solution_review -> verified_solution_review -> approved_solution_review 生命周期，并保持同一轮 scope 只有一份 canonical artifact；5）review 结论必须区分 blocking / non-blocking / promotion interlocks；6）需要更新 lifecycle 时必须补 review_paths、approved_at、approved_by 等事实，并跑 lifecycle/task-ledger/sprint-status 相关 gate；7）批准后只给 promotion handoff，不得代替 technical-solution-promotion 做正式 cutover。
```
