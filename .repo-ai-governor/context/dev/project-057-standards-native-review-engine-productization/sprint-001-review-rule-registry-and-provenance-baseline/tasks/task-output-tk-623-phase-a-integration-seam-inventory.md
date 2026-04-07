# TK-623 Phase A Integration Seam Inventory And Acceptance Baseline

- Status: completed
- Date: 2026-04-07
- Owner: `AI-Agent`
- Task: `TK-623`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-001-review-rule-registry-and-provenance-baseline`

## 1. Runtime Seam Inventory

1. `packages/standards`
   - owns review-rule finite sets, bundle projection contracts, registry validation, and curated Phase A projected subset assets
2. `apps/cli/src/runtime/review`
   - remains the Phase B consumer for normalized rule ids, provenance-aware finding fields, and hybrid deterministic + delegated orchestration seams
3. `runtime.agent-projection`
   - will consume `ProjectedReviewRuleBundle` instead of raw markdown-only prompt truth during Sprint 003 delegated reviewer handoff
4. `runtime.durable-storage`
   - will persist provenance-aware finding fields and round diagnostics in Sprint 002 without replacing canonical review markdown or `CR-xxx`
5. `runtime.cli-interactive-shell`
   - will stay presentation-only for provenance-aware review summary and coverage output; it must not become the owner of rule coverage truth

## 2. Sprint Sequencing Baseline

1. Sprint 002
   - add provenance-aware finding contract and artifact rendering surfaces on top of the frozen review-rule bundle
2. Sprint 003
   - normalize delegated reviewer handoff and source-aware closure semantics after provenance fields stop drifting
3. Sprint 004
   - add coverage metrics, delegated activation policy, rollout evidence, and project closeout after the first three seams stabilize

## 3. Acceptance Signals

1. Sprint 001 acceptance
   - review-rule finite sets live in `packages/standards/src/constants`
   - review-rule interfaces and registry compile and are test-covered
   - Phase A projected subset is materialized as a structured bundle artifact
2. Sprint 002 acceptance
   - review findings carry `ruleId/sourceType/executionMode/severity` in canonical typed contracts
   - deterministic findings and delegated findings can normalize into one model without inventing a second lifecycle
3. Sprint 003 acceptance
   - delegated reviewer handoff consumes structured projected rules
   - `review-verify` can distinguish deterministic vs standards-guided vs risk closure semantics
4. Sprint 004 acceptance
   - coverage reporting shows which projected rules were deterministically covered, standards-guided, or still residual
   - delegated activation policy is explicit enough for rollout and adopter-facing handoff

## 4. Guardrails

1. do not move canonical review truth away from `review/code_review_*`, `review/verified_code_review_*`, `review/resolved_code_review_*`, and paired `CR-xxx`
2. do not let `packages/standards` own review execution orchestration; it owns structured assets only
3. do not promise clean automated closure for `CS-033` or `CS-034` until same-window evidence and hardcoded-text detection have dedicated runtime coverage
