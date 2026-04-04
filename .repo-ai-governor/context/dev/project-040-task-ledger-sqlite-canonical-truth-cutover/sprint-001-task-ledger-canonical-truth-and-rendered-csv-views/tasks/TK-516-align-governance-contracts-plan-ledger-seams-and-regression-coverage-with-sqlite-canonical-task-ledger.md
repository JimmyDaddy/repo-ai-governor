# TK-516 align governance contracts plan-ledger seams and regression coverage with sqlite canonical task ledger

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-040-task-ledger-sqlite-canonical-truth-cutover`
- Sprint: `sprint-001-task-ledger-canonical-truth-and-rendered-csv-views`

## 1. 任务目标

将 formal docs、governance contract 和 planning/ledger seam draft 同步到 “sqlite canonical truth + rendered `tasks.csv` view” 的新口径，并确认关键定向验证通过。

## 2. Depends On

1. `TK-515`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/adrs/sqlite-fs-default-runtime-truth-and-rendered-csv-views.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
7. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`

## 3. 预期产物

1. 更新后的 durable-storage formal docs
2. 更新后的 task-ledger governance contract
3. 更新后的 plan-ledger seam draft
4. 本轮 completion audit summary

## 4. 实施计划

1. 更新 `runtime.durable-storage` formal docs 中 task ledger 真值边界。
2. 更新 task-ledger governance/decomposition 文档，明确 sqlite canonical ledger 与 rendered `tasks.csv` 的关系。
3. 更新 `session.main plan` draft，避免继续把 `tasks.csv` 写成独立主真值。
4. 补齐 project closeout 文档与验证结果回链。

## 5. 验证

1. `pnpm exec vitest run test/task-ledger-projection.integration.test.ts test/sync-task-ledger.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`。
2. 2026-04-04：状态切换为 `in_progress`，开始同步 durable-storage formal docs、task-ledger governance contract 与 planning/ledger seam draft。
3. 2026-04-04：已完成 formal docs/draft 口径更新、project-040 completion audit summary 与关键定向验证回链。
