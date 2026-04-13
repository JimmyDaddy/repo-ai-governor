---
name: technical-solution-drafting
description: Repository-local workflow for creating or reshaping technical-solution drafts under `.repo-ai-governor/draft/**` with the repository's standard draft template. Use when the user says "生成技术方案草案", "起草方案", "按模板出 draft", "把这个 draft 按模板整理", or otherwise wants a repo-governed technical-solution draft before review or promotion.
---

# Technical Solution Drafting

## Overview

Use this repository-local skill to create or reshape technical-solution drafts in a controlled way. It complements the existing lifecycle:

1. `technical-solution-drafting` owns `problem/request -> draft`
2. `technical-solution-review` owns `draft -> review_pending -> approved`
3. `technical-solution-promotion` owns `approved -> active/superseded`

Prefer this skill over generic free-form document writing whenever the request is about creating, rewriting, or template-normalizing a technical-solution draft in this repository.

## Trigger Mapping

1. `生成技术方案草案` / `起草方案` / `按模板出 draft`
- Interpret as `create-draft`.

2. `改一下这个 draft` / `按 review 意见修改草案`
- Interpret as `revise-draft`.

3. `把这个 draft 按模板整理` / `统一这个草案结构`
- Interpret as `normalize-existing-draft`.

4. `先看看怎么起草` / `给我一个方案草案骨架`
- Interpret as `prepare-draft`.

## Required Inputs

Read these before doing anything else:

1. `AGENTS.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
7. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
8. `.repo-ai-governor/normative_knowledge_sources/governance/technical-solution-draft-template.md`
9. `.codex/skills/technical-solution-review/SKILL.md`
10. `.codex/skills/technical-solution-promotion/SKILL.md`

Then load only the specific code paths, prior drafts, module docs, lifecycle entries, and manifest-triggered L1/L2 docs required by the requested draft scope.

## Phase 1: Resolve Target And Draft Mode

1. Resolve the requested mode:
- `prepare-draft`
- `create-draft`
- `revise-draft`
- `normalize-existing-draft`

2. Resolve the target surface:
- net-new draft under `.repo-ai-governor/draft/**`
- existing draft file already under `.repo-ai-governor/draft/**`
- existing lifecycle entry identified by `solution_id`, `draft_paths`, or topic

3. Decide the canonical output path:
- Prefer an existing draft path when the topic already has one canonical file.
- For net-new drafts, create a single descriptive file name under `.repo-ai-governor/draft/**`.

4. Resolve lifecycle facts early:
- locate an existing `solution_id` when one already exists
- create a new lifecycle entry only when the draft is net-new and worth preserving
- never create parallel lifecycle entries for the same scope

5. If the draft touches architecture boundaries, runtime contracts, module graph edges, or triad conclusions, load the corresponding manifest-triggered L1/L2 docs before finalizing the structure.

## Phase 2: Build Evidence Before Writing

1. Read the user request, relevant repo truth, existing active/superseded solutions, and related code seams before writing conclusions.
2. Separate repository truth from supplemental outside evidence.
3. Decide whether the draft is:
- a net-new solution proposal
- an expansion of an existing draft
- a review-driven remediation of an existing draft
4. Avoid drafting a parallel solution when an active or still-useful draft already covers the same boundary unless the user explicitly wants a competing alternative.

## Phase 3: Write Or Normalize The Draft

1. Always instantiate the skeleton from `.repo-ai-governor/normative_knowledge_sources/governance/technical-solution-draft-template.md`.
2. Keep the required sections even when some sections are short or marked `不适用`.
3. Make the recommendation explicit; do not force later review to infer the chosen direction from scattered notes.
4. Make the handoff fields concrete enough that `technical-solution-review` can immediately consume the draft:
- suggested `solution_id`
- expected `target_module_ids`
- review focus areas
- promotion landing hints when they are already knowable
5. If the user only asked for an outline, keep content brief but preserve the same section skeleton.
6. Never write formal module docs, manifest entries for draft paths, or `active` lifecycle state from this workflow.

## Phase 4: Lifecycle Write-Back And Handoff

1. `prepare-draft`
- do not claim the draft is complete
- create lifecycle entry only when the user explicitly wants the outline persisted as a real draft file

2. `create-draft`
- create or update the lifecycle entry to `draft`
- fill `draft_paths`
- keep `review_paths` and `final_paths` empty

3. `revise-draft`
- update the draft content in place
- keep the existing lifecycle status unless the user explicitly asks for a state transition through review/promotion
- never clear historical `review_paths` just because the draft changed

4. `normalize-existing-draft`
- keep the draft file canonical
- restructure content to match the standard template
- preserve the draft's actual conclusions unless the user also asked for substantive changes

## Draft Artifact Contract

Every new or normalized technical-solution draft should include these top fields:

1. `Status`
2. `Date`
3. `Owner`
4. `Scope`
5. `Target Modules`
6. `Related Inputs`

Default body sections:

1. `背景与问题`
2. `目标`
3. `非目标`
4. `现状与约束`
5. `方案选项与对比`
6. `推荐方案`
7. `核心设计与契约影响`
8. `风险与权衡`
9. `分阶段落地建议`
10. `Review / Promotion Handoff`

## Verification

Run the relevant checks for the surfaces you changed:

1. When lifecycle registry changed:
- `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`

2. When sprint plan or task ledger changed:
- `node ./scripts/governance/check-task-ledger-sync.js`
- `node ./scripts/governance/check-sprint-plan-status-sync.js`

3. When the draft template or normative-loading manifest changed:
- `node ./scripts/governance/run-normative-loading-manifest-gate.js`

4. When this skill changed:
- `python3 /Users/jimmydaddy/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/technical-solution-drafting`

5. When the change window only touches drafts, lifecycle metadata, template docs, or repo-local skills:
- build is not required unless `apps/**`, `packages/**`, `bin/**`, or `test/**` changed in the same window

## Guardrails

1. Never treat a draft as a formal source of truth.
2. Never register `.repo-ai-governor/draft/**` in normative-loading manifest.
3. Never skip the template when creating a new draft.
4. Never mark a solution `approved` or `active` in this workflow.
5. Never invent a second canonical draft for the same scope without an explicit boundary reason.
6. Never hide unresolved trade-offs; record them in `风险与权衡` or `Review / Promotion Handoff`.
7. When external research materially shapes the draft, mark it as supplemental evidence and prefer official docs or primary sources.

## Result Template

Use this structure in the final response, adapted to the actual outcome:

1. `Mode`: `prepare-draft` / `create-draft` / `revise-draft` / `normalize-existing-draft`
2. `Target`: `solution_id` + draft path
3. `Draft Outcome`: created / updated / normalized
4. `Lifecycle Updates`: created/updated draft entry or kept existing status
5. `Verification`: commands run + pass/fail
6. `Next Step`: review draft / continue drafting / hand off to `technical-solution-review`

## Portable Prompt

When another AI surface cannot load skill folders, paste this prompt directly:

```text
你是当前仓库的技术方案 drafting 助手。严格执行：1）先读 AGENTS.md、current-context、normative-loading-manifest、product-requirements-brief、code_standards、long-term-maintenance-guide、technical-solution-lifecycle-registry、technical-solution-draft-template、technical-solution-review skill、technical-solution-promotion skill；2）先判断是 prepare-draft、create-draft、revise-draft 还是 normalize-existing-draft；3）新 draft 一律落在 `.repo-ai-governor/draft/**`，并默认使用仓库 technical-solution-draft-template，而不是自由发挥结构；4）drafting 只负责问题/request -> draft，不得直接写 approved/active、不得把 draft 注册进 manifest；5）若需要 lifecycle write-back，最多推进到 `draft` 或保持既有状态，不清空历史 review_paths；6）最终输出必须包含明确推荐方案、风险与权衡、分阶段落地建议，以及 review/promotion handoff 信息。
```
