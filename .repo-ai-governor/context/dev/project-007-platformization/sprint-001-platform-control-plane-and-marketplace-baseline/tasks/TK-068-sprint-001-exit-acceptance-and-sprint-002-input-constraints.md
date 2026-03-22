# TK-068 sprint-001 出口验收与 sprint-002 输入约束

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-007-platformization`
- Sprint: `sprint-001-platform-control-plane-and-marketplace-baseline`

## 1. 任务目标

汇总 sprint-001 交付证据，形成 Stage 8 首轮出口验收基线并沉淀 sprint-002 输入约束。

## 2. Depends On

1. `TK-065`
2. `TK-066`
3. `TK-067`
4. `DA-078`
5. `DA-079`
6. `DA-080`

## 3. 预期产物

1. `DA-081` sprint-001 出口验收与 sprint-002 输入约束文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-065-slot-marketplace-registry-index-and-publish-contract-baseline.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-066-visual-config-and-execution-console-contract-baseline.md`
4. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-067-org-policy-distribution-and-audit-hub-contract-baseline.md`

## 5. 实施计划

1. 汇总 `DA-078/DA-079/DA-080` 形成 sprint-001 出口验收结论。
2. 明确 sprint-002 的实施优先级、风险分级和门禁前置条件。
3. 同步任务台账、artifact registry 与 project 里程碑回链。

## 6. sprint-001 出口验收基线（DA-081）

1. 平台控制面与租户工作区契约基线
   - 验收结果：通过
   - 验证证据：`DA-077`、`TK-064`、`check-task-ledger-sync`
2. 插槽市场注册索引与发布契约基线
   - 验收结果：通过
   - 验证证据：`DA-078`、`TK-065`、`reconcile-artifact-dependencies`
3. 可视化配置与执行面板契约基线
   - 验收结果：通过
   - 验证证据：`DA-079`、`TK-066`、`pnpm run check`
4. 组织级策略分发与审计汇聚契约基线
   - 验收结果：通过
   - 验证证据：`DA-080`、`TK-067`、`check-artifact-registry-lifecycle`
5. 台账一致性与 sprint 状态收敛
   - 验收结果：通过
   - 验证证据：`check-task-ledger-sync`、`check-sprint-plan-status-sync`

## 7. sprint-002 输入约束总览

1. 统一输入入口
   - sprint-002 必须默认消费 `DA-081` 作为输入约束源，禁止绕过。
2. 实施优先级
   - 第一优先：`TK-069`（市场供给链与权限治理）。
   - 第二优先：`TK-070`、`TK-071`（控制面可视化联调与策略分发治理并进）。
   - 第三优先：`TK-072`（跨租户审计视图与导出治理）。
   - 收口任务：`TK-073`（project-007 出口验收与后续 rollout 输入约束）。
3. 风险分级约束
   - `P0` 任务（`TK-069/070/071/073`）必须在变更进入主干前通过完整门禁链路。
   - `TK-072` 涉及跨租户查询与导出能力，默认按高风险处理并要求显式权限校验证据。
4. 门禁前置条件
   - 必须保持 Stage 7 既有门禁可复跑：`test:resilience`、`release:rollback-rehearsal`、`release:ga-candidate-unified-gate`。
   - sprint-002 内所有任务在收尾前必须通过 `check-task-ledger-sync` 与 `check-sprint-plan-status-sync`。
5. 依赖与回链约束
   - 所有 sprint-002 任务产物必须按 `artifact_id + artifact_path` 双键登记并回链到 `tasks.csv/checklist/plan`。
   - 若产物进入 `deprecated`，需在宽限窗口后迁移到 archive registry，避免主 registry 膨胀。

## 8. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始汇总 `DA-078/DA-079/DA-080` 验收证据并收敛 sprint-002 输入约束。
3. 2026-03-22：完成 `DA-081`，落地 sprint-001 出口验收结论与 sprint-002 输入约束，状态切换为 `completed`。

## 10. 产出

1. `DA-081` `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/TK-068-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-007-platformization/sprint-001-platform-control-plane-and-marketplace-baseline/plan.md`
5. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
6. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
