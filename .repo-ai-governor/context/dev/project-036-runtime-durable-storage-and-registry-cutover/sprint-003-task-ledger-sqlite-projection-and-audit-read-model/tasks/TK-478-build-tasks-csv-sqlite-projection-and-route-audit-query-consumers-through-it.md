# TK-478 build tasks.csv sqlite projection and route audit-query consumers through it

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-003-task-ledger-sqlite-projection-and-audit-read-model`

## 1. 任务目标

为 `tasks.csv` 建立 sqlite projection/read-model，并让审计、查询、统计与 UI 检索 consumer 优先消费该 read-model，同时保持 `tasks.csv` 的 human-readable canonical source 身份不变。

## 2. Depends On

1. `TK-477`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`

## 3. 预期产物

1. `tasks.csv` sqlite projection/read-model schema
2. 全量重建与增量同步机制
3. audit/query/UI consumer 切换方案
4. projection consistency verification baseline

## 4. 实施计划

1. 明确 `tasks.csv` canonical source 与 sqlite projection 的字段映射与 rebuild semantics。
2. 建立全量重建与增量同步路径，保证 projection 可重建、可校验。
3. 让审计、统计、查询与 UI consumer 优先读 sqlite projection，而不是重复解析 CSV。
4. 补齐 projection drift detection 与 consumer parity 回归。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `pnpm run build`
3. 与 task ledger / audit / query / UI 检索相关的定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
2. 2026-04-02：状态切换为 `active`，随 `sprint-003` 成为当前 primary planning surface；开始承接 `tasks.csv` sqlite projection/read-model 与 audit/query/UI consumer 切换。
3. 2026-04-02：新增 `scripts/governance/task-ledger-projection.js`，建立 `tasks.csv -> sqlite` projection/read-model，并补齐 `test/task-ledger-projection.integration.test.ts` 的 rebuild / latest-row / status read-model 回归。
4. 2026-04-02：将 `check-sprint-plan-status-sync`、`check-technical-solution-delivery-registry`、`check-artifact-registry-lifecycle`、`reconcile-artifact-dependencies` 切换为优先消费 sqlite projection，而不再重复解析 canonical `tasks.csv`。
5. 2026-04-02：为 projection sqlite runtime 产物补充 `.gitignore` 规则，避免把 `.repo-ai-governor/context/dev/sqlite/task-ledger-projection.sqlite` 及其 `-wal/-shm` 临时文件误纳入版本库。
6. 2026-04-02：验证通过 `pnpm exec biome check scripts/governance/task-ledger-projection.js scripts/governance/check-sprint-plan-status-sync.js scripts/governance/reconcile-artifact-dependencies.js scripts/governance/check-artifact-registry-lifecycle.js scripts/governance/check-technical-solution-delivery-registry.js test/task-ledger-projection.integration.test.ts test/technical-solution-delivery-registry-gate.integration.test.ts`、`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run test/task-ledger-projection.integration.test.ts test/technical-solution-delivery-registry-gate.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js --format json`、`pnpm run build`；任务收口为 `completed`。
