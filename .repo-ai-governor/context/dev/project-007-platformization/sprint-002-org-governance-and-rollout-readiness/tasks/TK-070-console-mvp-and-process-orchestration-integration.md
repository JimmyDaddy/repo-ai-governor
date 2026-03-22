# TK-070 可视化面板 MVP 与流程编排联调

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-007-platformization`
- Sprint: `sprint-002-org-governance-and-rollout-readiness`

## 1. 任务目标

实现可视化配置与执行面板 MVP，并与流程编排、策略查看和执行回放链路完成联调。

## 2. Depends On

1. `TK-068`
2. `TK-069`
3. `DA-081`
4. `DA-082`

## 3. 预期产物

1. `DA-083` 可视化面板 MVP 与流程编排联调实现基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-069-marketplace-supply-chain-and-access-control-implementation.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-066-visual-config-and-execution-console-contract-baseline.md`

## 5. 实施计划

1. 建立面板端配置读写与执行启动最小路径。
2. 打通执行状态、策略命中与审计回放跳转。
3. 验证高风险操作在 UI 路径下的确认/阻断语义一致性。

## 6. 可视化面板 MVP 与流程编排联调实现基线（DA-083）

1. MVP 功能边界
   - `pipeline-overview`：展示流程阶段、节点状态、当前执行位点。
   - `config-editor`：可视化读写关键配置并进行 schema 级校验。
   - `execution-launcher`：基于策略与权限触发执行启动。
   - `replay-entry`：从执行记录跳转回放与审计详情。
2. 流程编排联调契约
   - 执行启动必须回链 `processId`、`executionId`、`executionSessionId`。
   - 节点状态映射统一：`queued/running/succeeded/failed/cancelled`。
   - 策略命中结果统一映射：`allow/confirm/block/escalate`。
3. 高风险交互语义
   - 当动作属于高风险集（跨租户发布、强制回滚、策略强制覆盖）时：
     - UI 必须展示风险摘要与影响范围；
     - 未确认不得执行写操作；
     - 拒绝后必须记录拒绝原因并回链审计。
4. 回放与审计联动
   - 回放视图必须提供 `executionId -> stageId -> policyDecision` 的可追溯链路。
   - 所有 UI 触发的执行操作必须写入 `auditRecordedAt` 与操作人上下文。
5. 降级策略
   - 当编排服务不可用时，面板退化为只读视图并显式提示 `nextAction`。
   - 禁止在降级态下隐藏失败原因或吞掉风险提示。

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛 console MVP 功能边界与编排联调契约。
3. 2026-03-22：完成 `DA-083`，固化可视化面板与执行/策略/回放链路联调基线，状态切换为 `completed`。

## 9. 产出

1. `DA-083` `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-070-console-mvp-and-process-orchestration-integration.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/plan.md`
5. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
6. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
