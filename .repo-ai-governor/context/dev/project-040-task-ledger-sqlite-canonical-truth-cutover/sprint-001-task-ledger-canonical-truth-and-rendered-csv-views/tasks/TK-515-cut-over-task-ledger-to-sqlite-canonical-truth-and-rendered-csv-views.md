# TK-515 cut over task ledger to sqlite canonical truth and rendered csv views

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-040-task-ledger-sqlite-canonical-truth-cutover`
- Sprint: `sprint-001-task-ledger-canonical-truth-and-rendered-csv-views`

## 1. 任务目标

将 task ledger 从 “`tasks.csv` canonical + sqlite projection” 切换为 “sqlite canonical truth + rendered `tasks.csv` compatibility view”，同时保留 bootstrap 能力与既有 read-model consumer。

## 2. Depends On

1. `TK-514`
2. `scripts/governance/task-ledger-projection.js`
3. `scripts/governance/sync-task-ledger.js`
4. `scripts/governance/check-task-ledger-sync.js`
5. `test/task-ledger-projection.integration.test.ts`
6. `test/sync-task-ledger.integration.test.ts`

## 3. 预期产物

1. task ledger sqlite canonical truth baseline
2. rendered `tasks.csv` compatibility view path
3. updated sync/check scripts
4. migration/bootstrap regression coverage

## 4. 实施计划

1. 将 `task-ledger-projection.js` 收敛为 sqlite canonical ledger seam，并保留 bootstrap/render/compare 能力。
2. 让 `sync-task-ledger.js` 改为先写 sqlite canonical rows，再渲染 `tasks.csv`。
3. 让 `check-task-ledger-sync.js` 读 sqlite canonical rows，并显式校验 CSV rendered-view drift。
4. 补齐定向集成测试，验证 bootstrap 后 sqlite 不再被手工 CSV 覆盖。

## 5. 验证

1. `pnpm exec vitest run test/task-ledger-projection.integration.test.ts test/sync-task-ledger.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`。
2. 2026-04-04：状态切换为 `in_progress`，开始切换 `task-ledger-projection.js`、`sync-task-ledger.js` 与 `check-task-ledger-sync.js` 的真值边界。
3. 2026-04-04：已完成 task ledger sqlite canonical truth cutover；bootstrap/render/compare 能力就位，`sync-task-ledger` 先写 sqlite 再渲染 CSV，且 task-ledger/artifact-lifecycle/delivery-registry 相关门禁通过。
