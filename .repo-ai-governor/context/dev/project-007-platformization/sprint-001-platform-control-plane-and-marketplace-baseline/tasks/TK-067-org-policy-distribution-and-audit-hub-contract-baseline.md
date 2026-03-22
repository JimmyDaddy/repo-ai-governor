# TK-067 组织级策略分发与审计汇聚契约基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-007-platformization`
- Sprint: `sprint-001-platform-control-plane-and-marketplace-baseline`

## 1. 任务目标

定义组织级策略包分发、灰度发布、回滚与审计汇聚契约，形成跨租户治理的一致性基线。

## 2. Depends On

1. `TK-064`
2. `DA-075`
3. `DA-077`

## 3. 预期产物

1. `DA-080` 组织级策略分发与审计汇聚契约基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-063-project-007-input-constraints-checklist.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-064-platform-control-plane-contract-and-tenant-workspace-model-baseline.md`

## 5. 实施计划

1. 定义策略包分发范围、租户选择、灰度窗口与回滚触发条件。
2. 定义跨租户审计汇聚最小字段、访问控制和导出约束。
3. 定义与 Stage 7 发布治理链路的兼容约束，避免语义漂移。

## 6. 组织级策略分发与审计汇聚契约基线（DA-080）

## 6.1 组织级策略包分发契约（Draft v1）

1. `PolicyPackage`
   - `policyPackageId`
   - `policyVersion`
   - `sourceScope`（organization）
   - `changeSummary`
   - `status`：`draft/approved/released/rollbacked`
2. `DistributionTarget`
   - `targetScope`：`tenant/workspace`
   - `targetId`
   - `rolloutChannel`：`canary/rc/ga`
   - `rolloutWindow`
   - `priority`
3. `DistributionRule`
   - `selector`（租户/工作区匹配条件）
   - `resolutionPolicy`：`strict/compatible/latest`
   - `conflictPolicy`：`block/confirm/escalate`
   - `fallbackVersionRef`

## 6.2 灰度发布与回滚触发契约

1. 灰度阶段
   - `canary`: 小流量租户验证
   - `rc`: 扩大范围验证
   - `ga`: 全量发布
2. 回滚触发（任一命中）
   - 策略命中率异常（超阈值）
   - 关键门禁失败（Stage 7 基线门禁任一失败）
   - 高风险人工确认超时或拒绝
3. 回滚动作
   - 将策略包状态切换为 `rollbacked`
   - 恢复 `fallbackVersionRef`
   - 输出结构化回滚审计事件

## 6.3 跨租户审计汇聚最小字段

1. `organizationId`
2. `policyPackageId`
3. `policyVersion`
4. `targetScope`
5. `targetId`
6. `distributionDecision`（allow/confirm/block/escalate）
7. `rolloutChannel`
8. `executionId`
9. `executionSessionId`
10. `riskLevel`
11. `matchedPolicies[]`
12. `auditRecordedAt`

## 6.4 访问控制与导出约束

1. 审计读取角色
   - `OrgAuditViewer`：只读检索
   - `OrgAuditMaintainer`：导出与保留策略管理
2. 导出限制
   - 必须指定 `organizationId + timeRange`
   - 默认脱敏租户隐私字段
   - 导出操作必须写审计事件
3. 隔离约束
   - 禁止跨组织查询与导出
   - 跨租户聚合仅在同一组织作用域内允许

## 6.5 与 Stage 7 发布治理兼容约束

1. 组织级策略分发不得绕过 Stage 7 既有门禁：
   - `test:resilience`
   - `release:rollback-rehearsal`
   - `release:ga-candidate-unified-gate`
2. 组织级 rollout 的高风险变更仍需经 `Change Risk Evaluator -> Policy Gate Engine`。
3. 回滚证据必须可回链 `executionId/artifactId/policyPackageId`。

## 6.6 失败语义与处置模型

1. `distribution_prepare_failed`
   - 阻断发布并进入 `block`。
2. `distribution_conflict_detected`
   - 根据 `conflictPolicy` 进入 `confirm/escalate`。
3. `audit_sink_unavailable`
   - 允许短时重试；超阈值进入 `escalate` 并暂停发布推进。
4. 所有失败均需输出：
   - `errorCode`
   - `hint`
   - `nextAction`

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛组织级策略分发、灰度回滚与审计汇聚契约。
3. 2026-03-22：完成 `DA-080`，固化组织级策略分发/审计汇聚字段与 Stage 7 兼容约束，状态切换为 `completed`。

## 9. 产出

1. `DA-080` `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-067-org-policy-distribution-and-audit-hub-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/tasks.csv`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
