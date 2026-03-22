# TK-071 组织级策略包分发与版本治理落地

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-007-platformization`
- Sprint: `sprint-002-org-governance-and-rollout-readiness`

## 1. 任务目标

实现组织级策略包分发、灰度发布、版本对齐与回滚治理，确保跨租户策略一致性可控。

## 2. Depends On

1. `TK-068`
2. `TK-069`
3. `DA-081`
4. `DA-082`

## 3. 预期产物

1. `DA-084` 组织级策略包分发与版本治理实现基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-067-org-policy-distribution-and-audit-hub-contract-baseline.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-069-marketplace-supply-chain-and-access-control-implementation.md`

## 5. 实施计划

1. 打通策略包分发、灰度窗口与租户路由策略。
2. 固化版本兼容、冲突检测与回滚规则。
3. 与审计链路联动记录策略命中和分发回执。

## 6. 组织级策略包分发与版本治理实现基线（DA-084）

1. 策略包生命周期
   - `draft -> approved -> released -> rollbacked`。
   - 生命周期推进必须记录审批人、发布时间、回滚触发因子。
2. 分发路径
   - `prepare`：校验策略包结构、依赖与兼容声明。
   - `route`：按组织/租户/工作区分发规则计算目标集合。
   - `rollout`：按 `canary/rc/ga` 分阶段推进。
   - `ack`：采集目标租户分发回执并写入审计。
3. 版本治理规则
   - 版本解析策略统一为 `strict/compatible/latest`。
   - 默认 `compatible`；命中不兼容时进入 `confirm` 或 `escalate`。
   - 强制覆盖仅允许在高权限角色下执行，并要求双重确认。
4. 冲突检测与回滚
   - 冲突类型：策略重复覆盖、版本倒退、目标路由冲突。
   - 处置路径：`block`（阻断）、`confirm`（人工确认）、`escalate`（升级处理）。
   - 回滚触发：关键门禁失败、异常命中率、人工拒绝。
   - 回滚动作：恢复 `fallbackVersionRef` 并输出结构化回滚事件。
5. 审计回执字段
   - `policyPackageId`、`policyVersion`、`targetId`
   - `rolloutChannel`、`distributionDecision`
   - `executionId`、`executionSessionId`
   - `errorCode`、`nextAction`、`auditRecordedAt`

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛策略包分发路径、版本治理与回滚规则。
3. 2026-03-22：完成 `DA-084`，固化组织级策略分发与版本治理实现基线，状态切换为 `completed`。

## 9. 产出

1. `DA-084` `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-071-org-policy-package-distribution-and-version-governance.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/plan.md`
5. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
6. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
