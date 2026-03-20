# TK-019 HITL 与 Notification Dispatcher 基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-002-policy-hitl-and-notification-baseline`

## 1. 任务目标

建立 HITL 决策回灌字段与 Notification Dispatcher 基线，支持主备通道与失败升级。

## 2. Depends On

1. `TK-017`
2. `TK-018`
3. `DA-027`
4. `DA-028`

## 3. 预期产物

1. `DA-029` hitl notification baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-017-change-risk-evaluator-baseline.md` (`DA-027`)
2. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-018-policy-gate-engine-baseline.md` (`DA-028`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§7.4`、`§7.5`、`§9.3`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§3`、`§4`、`§6`）

## 5. 实施摘要

1. 新增 `packages/notification-dispatcher` 基线包，落地 `NotificationDispatcher`：
   - 仅在 `confirm/escalate` 场景触发通知分发。
   - 主通道支持重试，失败后按 fallback 链路降级，最终进入 escalation 通道。
2. 固化通知语义常量与策略矩阵：
   - `NotificationChannel`、`NotificationRiskLevel`、`NotificationDispatchStatus`。
   - `DEFAULT_NOTIFICATION_POLICY_MATRIX`（按风险等级映射主备与升级渠道）。
3. 对齐审计最小字段：
   - 通知结果输出 `notificationChannel/notificationStatus/notifiedAtDisplay`。
   - 通知载荷覆盖 `executionId/stageId/routeKey/riskLevel/requiredAction/deadlineAt`。
4. 补齐标准化错误治理：
   - 新增 `GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID` 与 `GovernorErrorCode.NOTIFICATION_DISPATCH_FAILED`。
   - 异常路径统一抛出 `RuntimeError`。
5. 依赖边界治理同步：
   - 更新 `check-package-dependency-boundary`，显式约束 `notification-dispatcher -> core/config/shared`。
6. 新增 smoke 覆盖：
   - 非 HITL 场景跳过通知。
   - 主通道成功。
   - 主通道失败后 fallback 成功。
   - 主备均失败后 escalation 成功。
   - 所有通道失败抛出标准化错误。

## 6. 产出

1. `packages/notification-dispatcher/**`
2. `test/notification-dispatcher.smoke.test.ts`
3. `packages/shared/src/errors/error-code.constant.ts`
4. `scripts/governance/check-package-dependency-boundary.js`
5. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/review/verified_review_tk-019-hitl-notification-dispatcher-baseline.md`
6. `DA-029` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-019-hitl-feedback-and-notification-baseline.md`

## 7. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- notification-dispatcher.smoke.test.ts`
3. `node ./scripts/governance/reconcile-artifact-dependencies.js`
4. `pnpm run check`

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始实现 `notification-dispatcher` 主备通道与失败升级基线。
2. 2026-03-20：完成 `notification-dispatcher` 基线实现与 smoke 覆盖，并补齐标准化错误码与依赖边界规则。
3. 2026-03-20：完成 CR 与台账收敛，状态切换为 `completed`；验证通过 `pnpm run typecheck`、`pnpm run test -- notification-dispatcher.smoke.test.ts`、`pnpm run check`。
