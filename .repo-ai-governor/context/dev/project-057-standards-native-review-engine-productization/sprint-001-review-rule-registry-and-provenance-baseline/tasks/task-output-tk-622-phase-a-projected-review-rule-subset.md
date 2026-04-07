# TK-622 Phase A Projected Review Rule Subset And Standards Source Mapping

- Status: completed
- Date: 2026-04-07
- Owner: `AI-Agent`
- Task: `TK-622`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-001-review-rule-registry-and-provenance-baseline`

## 1. Curated Subset

1. `review-rule.cs-003-unresolved-markers`
   - `standardsSourceRefs`: `code_standards.md#CS-003`
   - `executionMode`: `deterministic`
   - `applicability`: `always`
   - `currentCoverage`: full via `cli-review.todo-marker-scan`
2. `review-rule.cs-015-triad-sync`
   - `standardsSourceRefs`: `code_standards.md#CS-015`
   - `executionMode`: `deterministic`
   - `applicability`: `governance_doc_change`
   - `currentCoverage`: full via `gate.check-docs-triad-sync`
3. `review-rule.cs-021-task-ledger-sync`
   - `standardsSourceRefs`: `code_standards.md#CS-021`, `task-ledger-single-write-source-contract.md#6-drift-governance`
   - `executionMode`: `deterministic`
   - `applicability`: `task_ledger_change`
   - `currentCoverage`: full via `gate.check-task-ledger-sync` + `gate.check-sprint-plan-status-sync`
4. `review-rule.cs-026-review-lifecycle-sync`
   - `standardsSourceRefs`: `code_standards.md#CS-026`, `cr-lifecycle-threshold-spec.md#3-transition-rules`
   - `executionMode`: `standards_guided`
   - `applicability`: `review_lifecycle_change`
   - `currentCoverage`: partial; `gate.check-code-review-status-sync` 只覆盖 review artifact filename/status，同步到 paired `CR-xxx` lifecycle 仍需 reviewer-guided closure
5. `review-rule.cs-033-user-facing-i18n`
   - `standardsSourceRefs`: `code_standards.md#CS-033`
   - `executionMode`: `standards_guided`
   - `applicability`: `user_facing_text_change`
   - `currentCoverage`: partial; parity gate exists, but hardcoded user-facing text still requires reviewer-guided inspection
6. `review-rule.cs-034-build-evidence`
   - `standardsSourceRefs`: `code_standards.md#CS-034`, `long-term-maintenance-guide.md#completion-claim-and-review-closure-build-protocol`
   - `executionMode`: `standards_guided`
   - `applicability`: `code_affecting_change`
   - `currentCoverage`: partial; build gate exists, but same-window evidence truth is not yet projected into canonical review checks

## 2. Projected Bundle

1. `packages/standards/src/examples/phase-a-review-rule-bundle.ts` 产出 `phaseAProjectedReviewRuleBundle`，作为 Sprint 002-004 shared baseline。
2. bundle id 冻结为 `bundle.review.phase-a`，finding source baseline 冻结为：
   - `deterministic_rule`
   - `standards_guided_inference`
   - `risk_inference`

## 3. Projected Pack Mapping

1. `review-rule.cs-021-task-ledger-sync` 与 `review-rule.cs-026-review-lifecycle-sync` 显式回链 `pack.official.workflow-review`，说明它们既受 repository governance source 约束，也与官方 workflow review pack 的 adopter-facing guidance 对齐。
2. 其余 `CS-003 / CS-015 / CS-033 / CS-034` 当前直接锚定 normative governance docs；如后续需要 adopter pack 化，可在不改 finding taxonomy 的前提下补充 `projectedPackRefs`。

## 4. Scope Notes

1. Phase A 只接受 curated projection，不尝试从 `code_standards.md` 自动解析任意规则。
2. `manual_only` execution mode 已被冻结进常量 contract，但本阶段 subset 暂未启用；它保留给 Sprint 003-004 的 rollout policy 与 explicit human-only checks。
