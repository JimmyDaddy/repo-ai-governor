# TK-060 受限网络与离线降级稳定性回归基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-002-resilience-and-ga-readiness`

## 1. 任务目标

建立受限网络模式与离线降级链路的稳定性回归基线，确保外部依赖不可达时治理主链路可持续执行。

## 2. Depends On

1. `TK-059`
2. `DA-071`

## 3. 预期产物

1. `DA-072` 受限网络与离线降级回归基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-059-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.8`）

## 5. 实施计划

1. 定义 restricted-network 与 offline-degrade 场景矩阵。
2. 固化关键治理路径（规则检查、流程推进、台账回写）在降级场景下的通过标准。
3. 输出回归执行入口与失败处置策略。

## 6. 受限网络与离线降级回归基线（DA-072）

1. 场景矩阵（restricted-network/offline-degrade）
   - `restricted-network-local-fallback`：验证路由调度在外部网络面不可达时可走本地 fallback，流程不中断。
   - `offline-degrade-integration-routing`：验证跨包路由在受限网络模式下仍能输出可审计的降级结果。
   - `task-ledger-sync`：验证降级回归执行后，任务台账仍满足 `CS-021` 一致性门禁。
   - `sprint-status-sync`：验证 sprint 状态聚合与任务执行记录一致。
   - `artifact-lifecycle-integrity`：验证产物生命周期与依赖链路在回归后保持可消费状态。
2. 通过标准（关键治理路径）
   - 规则检查：`check:task-ledger-sync`、`check:sprint-plan-status-sync`、`check:artifact-lifecycle` 必须全部通过。
   - 流程推进：restricted-network 场景下 adapter route 必须输出 fallback 或受控阻断，不允许 silent failure。
   - 台账回写：任务卡、checklist、tasks.csv 在任务状态切换时保持同源一致，不允许漂移。
3. 执行入口与失败处置
   - 新增 `scripts/ci/run-resilience-regression.js`，并通过 `pnpm run test:resilience` 对外暴露统一入口。
   - 任一子场景失败即立即退出并返回非零退出码，阻断后续门禁链路。

## 7. 验证

1. `pnpm run test:resilience`
2. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始固化 restricted-network/offline-degrade 回归入口与通过标准。
3. 2026-03-22：完成 `DA-072`，新增 `test:resilience` 回归入口并通过 `test:integration/check` 验证，状态切换为 `completed`。

## 9. 产出

1. `DA-072` `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-060-restricted-network-and-offline-degrade-regression-baseline.md`
2. `scripts/ci/run-resilience-regression.js`
3. `package.json`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
5. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
6. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/plan.md`
7. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/checklist.md`
8. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/tasks.csv`
