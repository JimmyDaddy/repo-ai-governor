# project-040 sprint-002 canonical naming cleanup completion audit summary

- Status: completed
- Date: 2026-04-04
- Project: `project-040-task-ledger-sqlite-canonical-truth-cutover`
- Sprint: `sprint-002-canonical-naming-cleanup-and-diagnostics-alignment`

## 1. Delivery Summary

1. task ledger sqlite 默认 canonical 路径已从 legacy `task-ledger-projection.sqlite` 收口为 `task-ledger.sqlite`，并保留 legacy 文件名自动迁移。
2. task ledger sqlite canonical 表名已收口为 `task_ledger_sources / task_ledger_rows`，legacy projection table/index naming 只保留兼容迁移职责。
3. CLI durable-storage diagnostics 已切到 `taskLedgerCanonicalTruth / task_ledger_canonical_truth`，并补齐对 legacy sqlite 文件名/表名的只读兼容探测。
4. 命名 clean-up 过程中顺带修复了 review-chain managed ledger backfill 在首个 `tasks.csv` 尚未落盘时的 render/backfill 回归。
5. runtime.durable-storage formal docs、task-ledger governance contract、project-040 plan 与历史 closeout evidence 已完成同步。

## 2. Verification

1. `pnpm exec vitest run test/task-ledger-projection.integration.test.ts test/sync-task-ledger.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
6. `node ./scripts/governance/check-docs-triad-sync.js`
7. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
8. `pnpm run build`

## 3. Evidence Paths

1. Sprint plan: [sprint-002-canonical-naming-cleanup-and-diagnostics-alignment/plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-040-task-ledger-sqlite-canonical-truth-cutover/sprint-002-canonical-naming-cleanup-and-diagnostics-alignment/plan.md)
2. Sprint checklist: [checklist.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-040-task-ledger-sqlite-canonical-truth-cutover/sprint-002-canonical-naming-cleanup-and-diagnostics-alignment/tasks/checklist.md)
3. Sprint tasks ledger view: [tasks.csv](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-040-task-ledger-sqlite-canonical-truth-cutover/sprint-002-canonical-naming-cleanup-and-diagnostics-alignment/tasks/tasks.csv)
4. Task cards: [TK-517-rename-task-ledger-sqlite-canonical-storage-naming-and-migrate-legacy-naming.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-040-task-ledger-sqlite-canonical-truth-cutover/sprint-002-canonical-naming-cleanup-and-diagnostics-alignment/tasks/TK-517-rename-task-ledger-sqlite-canonical-storage-naming-and-migrate-legacy-naming.md)
5. Task cards: [TK-518-align-cli-durable-storage-diagnostics-docs-and-regression-coverage-with-canonical-task-ledger-naming.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-040-task-ledger-sqlite-canonical-truth-cutover/sprint-002-canonical-naming-cleanup-and-diagnostics-alignment/tasks/TK-518-align-cli-durable-storage-diagnostics-docs-and-regression-coverage-with-canonical-task-ledger-naming.md)

## 4. Residual Notes

1. `scripts/governance/task-ledger-projection.js` 的源码文件名仍保留 legacy “projection” 命名；当前只收口 durable truth 语义、sqlite naming 与 outward diagnostics naming，源码文件名是否进一步重命名可作为后续纯代码整理窗口处理。
2. `tasks.csv` 继续保留为 rendered compatibility view；本轮不会重新把它抬回 canonical truth。
