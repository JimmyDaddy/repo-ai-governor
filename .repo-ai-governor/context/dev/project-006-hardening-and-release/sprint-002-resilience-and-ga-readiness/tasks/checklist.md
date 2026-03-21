# checklist

- [x] TK-060 受限网络与离线降级稳定性回归基线
  - 2026-03-22：任务创建，状态初始化为 `planned`。
  - 2026-03-22：任务启动，状态切换为 `active`，开始固化 restricted-network/offline-degrade 稳定性回归基线。
  - 2026-03-22：完成 `DA-072`，新增 `test:resilience` 回归入口并通过 `pnpm run test:resilience`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`，状态切换为 `completed`。
- [x] TK-061 回滚演练与恢复流程基线
  - 2026-03-22：任务创建，状态初始化为 `planned`。
  - 2026-03-22：任务启动，状态切换为 `active`，开始固化 canary/rc/ga 异常场景回滚演练与恢复流程基线。
  - 2026-03-22：完成 `DA-073`，落地 `release:rollback-rehearsal` 与结构化演练报告，并通过 `pnpm run release:check`、`pnpm run release:ga-check`、`pnpm run check`，状态切换为 `completed`。
- [x] TK-062 GA 候选联合门禁（契约+稳定性+发布）基线
  - 2026-03-22：任务创建，状态初始化为 `planned`。
  - 2026-03-22：任务启动，状态切换为 `active`，开始收敛 GA 候选联合门禁执行器与审计报告模板。
  - 2026-03-22：完成 `DA-074`，落地 `release:ga-candidate-unified-gate` 并通过 `pnpm run release:ga-candidate-unified-gate`、`pnpm run check`，状态切换为 `completed`。
- [x] TK-063 project-006 出口验收与 project-007 输入约束
  - 2026-03-22：任务创建，状态初始化为 `planned`。
  - 2026-03-22：任务启动，状态切换为 `active`，开始汇总 `DA-072/DA-073/DA-074` 验收证据并生成 `DA-076` 输入约束清单。
  - 2026-03-22：完成 `DA-075/DA-076`、project-006 完成态审计摘要与里程碑回链，并通过 `reconcile-artifact-dependencies`、`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-artifact-registry-lifecycle`、`pnpm run check`，状态切换为 `completed`。
