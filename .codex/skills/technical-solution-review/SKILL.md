---
name: technical-solution-review
description: Repository-local workflow for reviewing draft technical solutions in this workspace before promotion. Use when the user says "评审方案", "review 技术方案", "帮我 review draft", "判断这个方案能不能过审", "复核方案修改后是否可以批准", or otherwise wants to move a draft technical solution from `draft`, through delegated or local review rounds, to `approved` with explicit review evidence and promotion handoff.
---

# Technical Solution Review

## Overview

Use this skill to run the repository's technical-solution review loop in a controlled way. It complements `technical-solution-promotion`: this skill owns `draft -> review_pending -> approved`, while promotion owns `approved -> active/superseded` formal cutover.

When the user wants iterative delegated review, run a fresh reviewer sub-agent round against the current draft, let the main agent recheck and revise the accepted issues, then launch another fresh reviewer round until the latest round reports no actionable problem. The main agent always remains the owner of lifecycle state, canonical artifact writes, and final approval.

## Trigger Mapping

1. `评审方案` / `review 技术方案` / `帮我 review draft`
- Interpret as `review-draft-solution`.

2. `复核方案修改后是否可以通过` / `re-review this solution`
- Interpret as `re-review-after-updates`.

3. `这个方案能不能批准` / `approve this reviewed solution`
- Interpret as `approve-reviewed-solution`.

4. `先看看这个方案是否 ready` / `check review readiness`
- Interpret as `prepare-review`.

5. `调起子 agent review 方案` / `循环 review 直到没有问题`
- Interpret as `review-draft-solution` with delegated review rounds enabled.

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

Load only the specific draft file, prior review artifacts, affected module docs, and manifest-triggered L1/L2 docs required by the requested review. When delegated review rounds are requested and the calling surface supports sub-agents, also load `.codex/skills/workspace-scoped-cr-loop/SKILL.md` as the structural reference for fresh-round review discipline, but keep lifecycle decisions in this workflow.

## Delegated Review Ownership

Use this split whenever delegated review rounds are enabled:

1. The main agent owns target resolution, baseline loading, artifact write-back, lifecycle state, verification runs, finding dispositions, draft revisions, and the final `approved / changes_required / deferred` decision.
2. The reviewer sub-agent owns only a single fresh review pass over the current technical-solution surface.
3. The reviewer sub-agent must not edit the draft, lifecycle registry, or review artifact unless the user separately asks for delegated authoring work.
4. Use a fresh reviewer sub-agent for every round; do not reuse a completed reviewer across rounds.
5. If the current AI surface cannot spawn sub-agents, keep the same round discipline but perform the review pass locally and record that delegated review was unavailable.

## Default Reviewer Configuration

When the user does not override reviewer settings and sub-agents are available, spawn the reviewer with:

1. model: `gpt-5.4`
2. reasoning effort: `xhigh`
3. role: `default`

## Reviewer Wait Guidance

When waiting for a reviewer sub-agent round:

1. default to `wait_agent` with `timeout_ms=900000` (`15` minutes) for each review round unless the user explicitly wants a different wait policy
2. do not treat the reviewer as stalled just because the first `1` to `2` minutes are quiet; technical-solution reviews can legitimately take longer
3. do not close or replace the reviewer early unless there is concrete failure evidence, the user asked to stop, or the runtime reports a terminal error
4. if you want a progress check before the full wait elapses, use non-destructive polling and keep the same reviewer alive

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
5. Determine whether delegated review rounds are required for this run.
- Enable them when the user explicitly asks for sub-agent review loops.
- You may also enable them by default on sub-agent-capable surfaces when the caller clearly wants iterative re-review and did not opt out.
6. If the solution touches triad docs, layer boundaries, runtime contracts, or module graph edges, load the corresponding manifest-triggered L1/L2 docs before making approval claims.

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
5. When delegated review rounds are enabled, each round follows this loop:
- spawn one fresh reviewer sub-agent against the current draft, prior artifact history, and affected module surfaces
- instruct the reviewer to produce severity-ordered findings, with explicit `blocking / non-blocking / promotion interlocks` grouping and evidence references
- require the reviewer to stay read-only and avoid lifecycle or artifact write-back
- let the main agent write the canonical artifact for that round and recheck every returned finding before accepting it
- let the main agent revise the draft and related review facts for all accepted findings, rerun the relevant verification, then launch a fresh reviewer sub-agent for the next round if actionable issues were found
- treat the latest fresh reviewer round with no actionable findings as the loop exit signal
6. When the draft is revised within the same round, re-review the same artifact:
- append dated disposition for each prior finding
- mark `accepted / rejected / deferred`
- record the evidence used to decide each disposition
- rename to `verified_solution_review_<slug>.md` only after every blocking issue has a clear disposition
7. Start a new round with a new canonical artifact path when a fresh post-fix reviewer still finds actionable issues.
- Do not reopen an already approved round.
- Do not silently overwrite a prior round's review history.
8. Move to `approved_solution_review_<slug>.md` only when:
- no blocking findings remain
- any deferred items are explicitly non-blocking with owner and target window
- the lifecycle entry can move to `approved` without also writing `final_paths`
9. The main agent must never accept reviewer findings blindly.
- Recheck each finding against repository truth and the loaded norms.
- Record `accepted / rejected / deferred` dispositions explicitly before editing the draft.
10. If delegated review rounds are enabled, borrow the fresh-round review pattern from `workspace-scoped-cr-loop`, but keep the canonical artifact write-back, lifecycle status, and approval decision in this workflow.

### Reviewer Prompt Contract

When you spawn the reviewer sub-agent, make the prompt concrete:

1. name the exact `solution_id`, draft path, and current round label
2. name the intended canonical review artifact path for the round, even though the main agent will perform the final write
3. list the required baseline docs: `AGENTS.md`, `current-context.md`, `normative-loading-manifest.yaml`, `product-requirements-brief.md`, `code_standards.md`, `long-term-maintenance-guide.md`, lifecycle registry, module registry, and `technical-solution-promotion`
4. include any manifest-triggered L1/L2 docs already loaded for the specific technical-solution surface
5. tell the reviewer to output severity-ordered findings with `blocking / non-blocking / promotion interlocks` separation
6. tell the reviewer to stay read-only and avoid changing draft, lifecycle, or review artifact files

### Loop Exit Rule

1. Exit the loop only when the latest fresh reviewer reports no actionable findings.
2. A clean round still needs explicit evidence and a recorded approval verdict before moving lifecycle status to `approved`.
3. If the user pauses after a non-clean round, leave the latest artifact and lifecycle state at `review_pending` or `verified`, whichever matches the current evidence.

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
2. `Reviewer Round`
3. `Blocking Findings`
4. `Non-Blocking Suggestions`
5. `Promotion Interlocks`
6. `Main-Agent Recheck`
7. `Verification`
8. `Decision`

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
9. Never let the reviewer sub-agent become the owner of canonical governance writes or the final approval call.
10. Never exit a delegated review loop just because one round was partially fixed; only the latest fresh re-review may close the loop.

## Result Template

Use this structure in the final response, adapted to the actual outcome:

1. `Mode`: `prepare-review` / `review-draft-solution` / `re-review-after-updates` / `approve-reviewed-solution`
2. `Target`: solution id + draft path
3. `Review Rounds`: delegated/local round count + latest round status
4. `Review Outcome`: approved / changes_required / deferred
5. `Lifecycle Updates`: status + `review_paths` / `approved_at` changes
6. `Verification`: commands run + pass/fail
7. `Next Step`: revise draft / rerun review / hand off to `technical-solution-promotion`

## Portable Prompt

When another AI surface cannot load skill folders, paste this prompt directly:

```text
你是当前仓库的技术方案 review 助手。严格执行：1）先读 AGENTS.md、current-context、normative-loading-manifest、product-requirements-brief、code_standards、long-term-maintenance-guide、technical-solution-lifecycle-registry、technical-solution-module-registry、technical-solution-promotion skill；2）先判断是 prepare-review、review-draft-solution、re-review-after-updates 还是 approve-reviewed-solution；3）review 只负责 draft -> review_pending -> approved，不得直接写 final_paths 或 active；4）review artifact 默认走 solution_review -> verified_solution_review -> approved_solution_review 生命周期，并保持同一轮 scope 只有一份 canonical artifact；5）若当前运行面支持子 agent 且用户要求循环复核，则每轮先调起一个只读 reviewer 子 agent 评审当前方案，主 agent 复核并修订接受的问题，再调起新的 reviewer 进入下一轮，直到最新一轮无可执行问题；6）review 结论必须区分 blocking / non-blocking / promotion interlocks；7）需要更新 lifecycle 时必须补 review_paths、approved_at、approved_by 等事实，并跑 lifecycle/task-ledger/sprint-status 相关 gate；8）批准后只给 promotion handoff，不得代替 technical-solution-promotion 做正式 cutover。
```
