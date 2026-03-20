# TK-018 Policy Gate Engine 基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-002-policy-hitl-and-notification-baseline`

## 1. 任务目标

建立 Policy Gate Engine 决策基线，输出 `allow/confirm/block/escalate` 并形成策略审计回链。

## 2. Depends On

1. `TK-017`
2. `DA-027`
3. `DA-026`

## 3. 预期产物

1. `DA-028` policy gate engine baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-017-change-risk-evaluator-baseline.md` (`DA-027`)
2. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-016-sprint-002-input-constraints-checklist.md` (`DA-026`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§7.1` ~ `§7.4`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§4`、`§6`）

## 5. 实施摘要

1. 新增 `packages/core-policy` 基线包，落地 `PolicyGateEngine`：
   - 输入：`riskEvaluation + context + compiledRules`。
   - 输出：`policyOutcome/decisionSource/matchedPolicies/matchedRuleIds/requiredReviewerRoles` 与审计记录。
2. 固化策略规则与回灌契约：
   - 默认规则覆盖“方案未通过阻断”“Review Verify 连败升级”“risk requiredAction 映射策略决策”。
   - HITL 回灌字段契约固定为 `decision/reason/constraints`。
3. 新增标准化错误码：
   - `POLICY_GATE_INPUT_INVALID`
   - `POLICY_GATE_RULE_INVALID`
   - `POLICY_GATE_HITL_FEEDBACK_INVALID`
   - `POLICY_GATE_EVALUATION_FAILED`
4. 新增 smoke 覆盖：
   - 低风险放行。
   - 风险确认到策略确认。
   - 方案未通过阻断。
   - Review Verify 连败升级。
   - HITL 回灌映射与异常路径。

## 6. 产出

1. `packages/core-policy/**`
2. `test/policy-gate-engine.smoke.test.ts`
3. `packages/shared/src/errors/error-code.constant.ts`
4. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/review/verified_review_tk-018-policy-gate-engine-baseline.md`
5. `DA-028` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-018-policy-gate-engine-baseline.md`

## 7. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- policy-gate-engine.smoke.test.ts`
3. `node ./scripts/governance/reconcile-artifact-dependencies.js`
4. `pnpm run check`

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始落地 `core-policy` 策略规则引擎与审计输出契约。
2. 2026-03-20：完成 `PolicyGateEngine` 基线实现与 `policy-gate-engine.smoke.test.ts` 覆盖，并补齐策略错误码。
3. 2026-03-20：完成 CR 与台账收敛，状态切换为 `completed`；验证通过 `pnpm run typecheck`、`pnpm run test -- policy-gate-engine.smoke.test.ts`、`pnpm run check`。
4. 2026-03-20：根据 `review_tk-017-tk-018-policy-risk-batch.md` 复核意见修复 `riskLevel` 输入校验、HITL 错误码分类与 `REVISE` 路径覆盖，并补齐架构依赖约束声明。
