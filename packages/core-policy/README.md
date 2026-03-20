# @repo-ai-governor/core-policy

- Status: baseline
- Date: 2026-03-20
- Scope: `project-002-governance-core / TK-018`

## Purpose

提供 `PolicyGateEngine` 基线，实现“风险结果 + 策略规则 -> allow/confirm/escalate/block 决策”的统一入口，并输出可审计的策略命中信息。

## Baseline API

1. `PolicyGateEngine`
   - `evaluate(input)`
   - `applyHitlFeedback(result, feedback)`
2. `PolicyGateRuleId`
3. `PolicyHitlDecision`
4. `PolicyDecisionSource`

## Notes

1. 基线规则覆盖：
   - 编码前方案未通过时阻断；
   - Review Verify 连续失败达到阈值时升级；
   - 风险输出的 `requiredAction` 映射到策略决策。
2. 决策输出包含审计回链字段：`policyOutcome/matchedPolicies/matchedRuleIds/requiredReviewerRoles`。
3. HITL 回灌字段契约固定为 `decision/reason/constraints`，供后续通知与审计模块复用。
