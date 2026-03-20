# @repo-ai-governor/core-change-risk

- Status: baseline
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-017`

## Purpose

提供 `ChangeRiskEvaluator` 基线，实现“变更事实 -> 结构化风险结果”的统一归一化，供后续 `Policy Gate Engine` 与 HITL 复用。

## Baseline API

1. `ChangeRiskEvaluator`
   - `evaluate(facts)`
2. `ChangeRiskLevel`
   - `LOW`
   - `MEDIUM`
   - `HIGH`
   - `CRITICAL`
3. `ChangeRiskRequiredAction`
   - `ALLOW`
   - `CONFIRM`
   - `ESCALATE`
   - `BLOCK`

## Notes

1. evaluator 只处理风险语义归一化，不直接执行策略决策或通知分发。
2. 输出包含 `riskLevel/riskReasons/requiredAction/requiredReviewerRoles/matchedPolicies`，可直接作为 `Policy Gate` 输入。
3. 风险判定异常统一抛出标准化错误（`RuntimeError + GovernorErrorCode`）。
