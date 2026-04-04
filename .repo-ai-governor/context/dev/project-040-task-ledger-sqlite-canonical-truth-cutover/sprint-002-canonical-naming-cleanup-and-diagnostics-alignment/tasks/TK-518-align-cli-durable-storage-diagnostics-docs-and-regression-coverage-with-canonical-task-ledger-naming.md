# TK-518 align cli durable-storage diagnostics docs and regression coverage with canonical task-ledger naming

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-040-task-ledger-sqlite-canonical-truth-cutover`
- Sprint: `sprint-002-canonical-naming-cleanup-and-diagnostics-alignment`

## 1. 任务目标

将 `doctor / verify` durable-storage diagnostics、formal docs 与 project-040 closeout evidence 同步到 task ledger canonical naming 口径，并确认 review-chain regression 不因命名 clean-up 破坏。

## 2. Depends On

1. `TK-517`
2. `apps/cli/src/runtime/durable-storage-diagnostics-runtime.ts`
3. `apps/cli/src/commands/doctor-command.ts`
4. `apps/cli/src/commands/verify-command.ts`
5. `apps/cli/test/cli-governance-runtime.integration.test.ts`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
8. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/adrs/sqlite-fs-default-runtime-truth-and-rendered-csv-views.md`
9. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 3. 预期产物

1. `taskLedgerCanonicalTruth / task_ledger_canonical_truth` diagnostics contract
2. legacy diagnostics 只读兼容覆盖
3. updated durable-storage/task-ledger governance docs
4. project-040 follow-up completion audit summary

## 4. 实施计划

1. 将 CLI durable-storage snapshot、check id、detail key 与 command `details` 字段统一切到 canonical truth naming。
2. 保留 CLI 对 legacy task-ledger sqlite 文件名/表名的只读兼容探测。
3. 更新 formal docs 与 project-040 closeout 文档，明确默认 canonical 路径与兼容迁移策略。
4. 跑完 task-ledger、docs、delivery registry 与 build 证据，形成 follow-up closeout。

## 5. 验证

1. `pnpm exec vitest run test/task-ledger-projection.integration.test.ts test/sync-task-ledger.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
6. `node ./scripts/governance/check-docs-triad-sync.js`
7. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
8. `pnpm run build`

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`。
2. 2026-04-04：开始同步 `doctor / verify` durable-storage diagnostics、formal docs 与 project-040 closeout evidence。
3. 2026-04-04：已完成 CLI diagnostics canonical naming 对齐、legacy diagnostics 只读兼容、review-chain managed ledger backfill regression fix、docs/plan/audit summary 同步与定向验证回链。
