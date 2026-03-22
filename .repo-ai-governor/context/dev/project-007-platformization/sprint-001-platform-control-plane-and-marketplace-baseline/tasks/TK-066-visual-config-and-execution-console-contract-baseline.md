# TK-066 可视化配置与执行面板契约基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-007-platformization`
- Sprint: `sprint-001-platform-control-plane-and-marketplace-baseline`

## 1. 任务目标

定义可视化配置与执行面板的交互契约、权限边界和执行事件回链字段，建立平台 UI/console 的契约基线。

## 2. Depends On

1. `TK-064`
2. `TK-065`
3. `DA-077`
4. `DA-078`

## 3. 预期产物

1. `DA-079` 可视化配置与执行面板契约基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-064-platform-control-plane-contract-and-tenant-workspace-model-baseline.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-065-slot-marketplace-registry-index-and-publish-contract-baseline.md`

## 5. 实施计划

1. 定义控制面配置读写、流程执行启动、策略查看与审计跳转的 API 契约。
2. 定义 panel 交互中的角色权限模型与高风险操作确认机制。
3. 定义与 reporting/audit 的事件关联字段，确保回放链路一致。

## 6. 可视化配置与执行面板契约基线（DA-079）

## 6.1 Console 模块边界（Draft v1）

1. `Workspace Config Console`
   - 管理组织/租户/工作区级配置视图与提交入口。
2. `Process Console`
   - 提交流程执行请求、展示阶段状态与策略命中结果。
3. `Policy & Risk Console`
   - 展示风险事实、策略决策与 HITL 处理状态。
4. `Audit & Replay Console`
   - 提供 execution/session/artifact 维度检索与回放跳转。

## 6.2 交互 API 契约（最小）

1. `loadWorkspaceConfig(input) -> { configSnapshot, etag, fetchedAt }`
2. `saveWorkspaceConfig(input) -> { configVersion, validationResult, updatedAt }`
3. `startExecution(input) -> { executionId, executionSessionId, queuedAt }`
4. `queryExecutionStages(input) -> { executionId, stages[], summary }`
5. `queryPolicyDecisions(input) -> { executionId, riskFacts, policyOutcomes[] }`
6. `requestHighRiskConfirmation(input) -> { requestId, requiredReviewerRoles[], deadlineAt }`
7. `queryAuditReplayIndex(input) -> { entries[], nextCursor }`

## 6.3 权限模型契约（Console RBAC）

1. `ConsoleViewer`
   - 只读访问配置、执行状态与审计检索。
2. `ConsoleOperator`
   - 允许提交执行请求与低风险配置更新。
3. `ConsoleMaintainer`
   - 允许更新租户级配置与发布通道参数。
4. `ConsoleApprover`
   - 允许处理 `confirm/escalate` 的高风险审批请求。
5. 权限约束
   - 高风险写操作必须具备 `ConsoleApprover` 或等效角色授权。
   - 不允许通过 UI 直接绕过策略引擎写入执行决策结果。

## 6.4 高风险操作确认契约

1. 触发条件（最小）
   - 命中 `policy_outcome=confirm/escalate`。
   - 涉及发布通道、权限上限或跨租户策略变更。
2. 请求载荷
   - `executionId`
   - `stageId`
   - `riskLevel`
   - `requiredAction`
   - `requiredReviewerRoles[]`
   - `deadlineAt`
3. 决策回灌
   - `decision=approve/reject/revise`
   - `reason`
   - `constraints`
4. 超时语义
   - 超过 `deadlineAt` 默认进入 `escalate`，并保留上下文快照。

## 6.5 Console 事件回链字段基线

1. `executionId`
2. `executionSessionId`
3. `stageId`
4. `routeKey`
5. `policyOutcome`
6. `riskLevel`
7. `workspaceId`
8. `artifactId`
9. `uiActionId`
10. `actorRole`
11. `startedAt`
12. `endedAt`

## 6.6 输出模式与前端展示约束

1. UI 展示可读文本允许本地化，但机器字段键保持稳定。
2. Console 导出的结构化数据遵循 `pretty/plain/json` 的语义分离：
   - `pretty`：人类可读摘要。
   - `plain`：无样式稳定文本。
   - `json`：CI/系统集成可解析结构化字段。
3. 非交互场景触发 API 时必须可降级为 `plain/json` 可解析输出。

## 6.7 降级与失败语义

1. `query*` 接口失败时返回结构化错误体，不允许空白或 silent failure。
2. `startExecution/saveWorkspaceConfig` 失败需附 `errorCode/hint/nextAction`。
3. 非关键展示模块失败不阻断关键执行路径，但必须写审计事件。
4. 关键写路径失败需阻断并进入策略决策（`block/escalate`）。

## 6.8 与 Stage 7 基线兼容约束

1. Console 不得提供绕过 Stage 7 门禁的“快速提交”路径。
2. 通过 Console 启动执行后，仍需满足：
   - `test:resilience`
   - `release:rollback-rehearsal`
   - `release:ga-candidate-unified-gate`
3. 高风险变更仍按 `Change Risk Evaluator -> Policy Gate Engine` 路径处理。

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛 console 交互 API、权限模型与高风险确认契约。
3. 2026-03-22：完成 `DA-079`，固化 UI/console 交互契约、回链字段与降级语义，状态切换为 `completed`。

## 9. 产出

1. `DA-079` `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-066-visual-config-and-execution-console-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/tasks.csv`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
