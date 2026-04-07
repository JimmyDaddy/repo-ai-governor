# TK-621 Review Rule Registry Contract Freeze

- Status: completed
- Date: 2026-04-07
- Owner: `AI-Agent`
- Task: `TK-621`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-001-review-rule-registry-and-provenance-baseline`

## 1. Contract Freeze

1. `packages/standards/src/constants/review-rule.constant.ts` 作为 review-rule finite sets 的统一常量入口，冻结 `ReviewRuleExecutionMode`、`ReviewFindingSourceType`、`ReviewRuleSeverity` 与 `ReviewRuleApplicability`。
2. `packages/standards/src/types/interfaces/review-rule.interface.ts` 作为 review-rule 专属 contract，冻结 `ReviewRuleDefinition`、`ProjectedReviewRuleBundle`、registry 读接口与 bundle projection 选项。
3. `packages/standards/src/review-rule-registry.ts` 提供 Phase A 的 canonical registry owner，负责规则注册、有限值校验、bundle 投影与 source mapping 汇总。

## 2. Canonical Artifact Fields

1. `ruleId`
2. `semanticKey`
3. `severity`
4. `executionMode`
5. `standardsSourceRefs`
6. `applicability`

## 3. Phase A Finding Taxonomy Freeze

1. `deterministic_rule`
   - 用于明确由本地 deterministic check 或治理 gate 命中的 finding。
2. `standards_guided_inference`
   - 用于引用 projected review rules 后，由 reviewer 或 hybrid pass 产出的 standards-guided finding。
3. `risk_inference`
   - 用于未直接锚定某条显式 review rule，但仍需保留为结构化 residual risk 的 finding。

## 4. Notes

1. `ReviewRuleApplicability` 在 Phase A 先按 review boundary trigger 建模，而不是按 UI surface 建模，避免 Sprint 002-004 继续用字符串字面量补语义。
2. `deterministicCheckIds` 被限定为仅 `executionMode=deterministic` 时允许出现，以防规则 contract 与实际执行覆盖率漂移。
3. canonical review truth 仍维持在 `review/code_review_*` 与 `CR-xxx`；本次新增 contract 只负责 review execution asset，不新增平行 lifecycle surface。
