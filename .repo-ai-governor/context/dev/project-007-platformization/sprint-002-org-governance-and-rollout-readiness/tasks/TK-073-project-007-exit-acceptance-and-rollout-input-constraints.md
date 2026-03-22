# TK-073 project-007 出口验收与后续 rollout 输入约束

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-007-platformization`
- Sprint: `sprint-002-org-governance-and-rollout-readiness`

## 1. 任务目标

汇总 project-007 交付证据，形成 Stage 8 出口验收基线并沉淀后续 rollout 输入约束。

## 2. Depends On

1. `TK-069`
2. `TK-070`
3. `TK-071`
4. `TK-072`
5. `DA-082`
6. `DA-083`
7. `DA-084`
8. `DA-085`

## 3. 预期产物

1. `DA-086` project-007 出口验收与后续 rollout 输入约束文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-069-marketplace-supply-chain-and-access-control-implementation.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-070-console-mvp-and-process-orchestration-integration.md`
4. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-071-org-policy-package-distribution-and-version-governance.md`
5. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-072-cross-tenant-audit-view-and-export-governance.md`

## 5. 实施计划

1. 汇总 `DA-082`~`DA-085` 验收证据并形成 project 结论。
2. 输出后续 rollout 的风险分级、门禁前置和回滚建议。
3. 同步任务台账、artifact registry、project 里程碑与完成态审计入口。

## 6. project-007 出口验收基线（DA-086）

1. 插槽市场供给链与权限治理
   - 验收结果：通过
   - 验证证据：`DA-082`、`TK-069`
2. 可视化面板 MVP 与流程编排联调
   - 验收结果：通过
   - 验证证据：`DA-083`、`TK-070`
3. 组织级策略包分发与版本治理
   - 验收结果：通过
   - 验证证据：`DA-084`、`TK-071`
4. 跨租户审计视图与导出治理
   - 验收结果：通过
   - 验证证据：`DA-085`、`TK-072`
5. 台账与生命周期治理一致性
   - 验收结果：通过
   - 验证证据：`reconcile-artifact-dependencies`、`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-artifact-registry-lifecycle`

## 7. 后续 rollout 输入约束

1. 入口约束
   - 后续 rollout 必须默认消费 `DA-086` 作为 Stage 8 已交付能力与风险边界入口。
2. 门禁前置
   - 不得绕过 Stage 7 已固化门禁：`test:resilience`、`release:rollback-rehearsal`、`release:ga-candidate-unified-gate`。
   - Stage 8 增量能力上线前需通过 `pnpm run check` 与台账一致性门禁。
3. 风险分级
   - `P0`：跨租户发布、策略强制覆盖、高风险导出。
   - `P1`：可视化配置修改、租户级路由调整。
   - 高风险动作必须具备 `confirm/escalate` 路径与可审计回执。
4. 回滚约束
   - rollout 失败时必须可回退到前一稳定版本并回链 `executionId/artifactId/policyPackageId`。
5. 依赖产物约束
   - 后续任务必须使用 `artifact_id + artifact_path` 双键消费 `DA-082`~`DA-086`，避免语义漂移。

## 8. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始汇总 `DA-082`~`DA-085` 证据并收敛 project-007 出口验收结论。
3. 2026-03-22：完成 `DA-086`，完成 project-007 出口验收与 rollout 输入约束沉淀，状态切换为 `completed`。

## 10. 产出

1. `DA-086` `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-073-project-007-exit-acceptance-and-rollout-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/project-007-platformization-completion-audit-summary.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/checklist.md`
4. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/tasks.csv`
5. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/plan.md`
6. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
7. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
