# TK-017 Change Risk Evaluator 基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-002-policy-hitl-and-notification-baseline`

## 1. 任务目标

建立 Change Risk Evaluator 基线，统一风险事实输入、风险等级输出与策略命中字段。

## 2. Depends On

1. `TK-016`
2. `DA-025`
3. `DA-026`
4. `DA-022`

## 3. 预期产物

1. `DA-027` change risk evaluator baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-016-sprint-001-governance-core-exit-acceptance-baseline.md` (`DA-025`)
2. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-016-sprint-002-input-constraints-checklist.md` (`DA-026`)
3. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-015-memory-session-store-baseline.md` (`DA-022`)
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§7.1`）
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§6` 模块依赖方向约束）

## 5. 实施摘要

1. 新增 `packages/core-change-risk` 基线包，落地 `ChangeRiskEvaluator`：
   - 输入：`changedPaths/fileCategories/requestedPermissions/commandClass` 与流程高风险信号。
   - 输出：`riskLevel/riskReasons/requiredAction/requiredReviewerRoles/matchedPolicies`。
2. 固化风险语义常量：
   - `ChangeRiskLevel`、`ChangeRiskRequiredAction`、`ChangeRiskReasonCode`。
   - `sensitivePathSegments/highRiskFileCategories/highRiskPermissionPrefixes/highRiskCommandClasses` 默认集合。
3. 补齐标准化错误治理：
   - 新增 `GovernorErrorCode.CHANGE_RISK_FACTS_INVALID` 与 `GovernorErrorCode.CHANGE_RISK_EVALUATION_FAILED`。
   - evaluator 异常路径统一抛出 `RuntimeError`。
4. 新增 smoke 覆盖：
   - 低风险 `allow` 场景。
   - 叠加高风险信号触发 `critical + block` 场景。
   - 输入缺失触发标准化错误场景。

## 6. 产出

1. `packages/core-change-risk/**`
2. `test/change-risk-evaluator.smoke.test.ts`
3. `packages/shared/src/errors/error-code.constant.ts`
4. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/code-review/verified_review_tk-017-change-risk-evaluator-baseline.md`
5. `DA-027` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-017-change-risk-evaluator-baseline.md`

## 7. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- change-risk-evaluator.smoke.test.ts`
3. `node ./scripts/governance/reconcile-artifact-dependencies.js`
4. `pnpm run check`

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始落地 `core-change-risk` 包与风险判定契约。
2. 2026-03-20：完成 evaluator 基线实现与 smoke 覆盖，并补齐 `DA-027` 产物登记。
3. 2026-03-20：完成 CR 复核与台账收敛，状态切换为 `completed`；验证通过 `pnpm run typecheck`、`pnpm run test -- change-risk-evaluator.smoke.test.ts`、`pnpm run check`。
