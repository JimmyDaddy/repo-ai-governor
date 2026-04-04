# TK-517 rename task-ledger sqlite canonical storage naming and migrate legacy naming

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-040-task-ledger-sqlite-canonical-truth-cutover`
- Sprint: `sprint-002-canonical-naming-cleanup-and-diagnostics-alignment`

## 1. 任务目标

将 task ledger sqlite 的默认文件名与表名收口到 canonical naming，同时保留对 legacy `task-ledger-projection.sqlite` 与 legacy table/index naming 的自动迁移兼容。

## 2. Depends On

1. `TK-515`
2. `scripts/governance/task-ledger-projection.js`
3. `scripts/governance/sync-task-ledger.js`
4. `scripts/governance/check-task-ledger-sync.js`
5. `test/task-ledger-projection.integration.test.ts`
6. `test/sync-task-ledger.integration.test.ts`

## 3. 预期产物

1. canonical sqlite 默认路径 `task-ledger.sqlite`
2. canonical 表名 `task_ledger_sources / task_ledger_rows`
3. legacy 文件名/表名/索引名自动迁移
4. missing-`tasks.csv` render/backfill regression 修复

## 4. 实施计划

1. 将 task ledger sqlite 默认文件名改为 `task-ledger.sqlite`。
2. 将 task ledger sqlite 表名从 projection naming 收口到 canonical naming，并保留 legacy schema migration。
3. 保持 `sync-task-ledger`、consumer 与 bootstrap/render 路径不需要手工数据迁移即可继续工作。
4. 补齐针对 legacy 文件名/表名迁移与 missing-`tasks.csv` 首次渲染的定向回归。

## 5. 验证

1. `pnpm exec vitest run test/task-ledger-projection.integration.test.ts test/sync-task-ledger.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`。
2. 2026-04-04：开始将 task ledger sqlite 默认文件名切到 `task-ledger.sqlite`，并为 legacy 文件名/表名/索引名补齐自动迁移。
3. 2026-04-04：已完成 canonical sqlite 文件名、表名与 legacy naming 自动迁移收口，并补齐 migration regression coverage 与 missing-`tasks.csv` render/backfill 回归修复。
