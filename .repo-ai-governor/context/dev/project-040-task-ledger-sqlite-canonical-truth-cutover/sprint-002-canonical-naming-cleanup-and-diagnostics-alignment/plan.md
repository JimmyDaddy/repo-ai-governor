# sprint-002-canonical-naming-cleanup-and-diagnostics-alignment 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-040-task-ledger-sqlite-canonical-truth-cutover`

## 1. Sprint Goal

完成 task ledger canonical sqlite 文件名、表名与 CLI durable-storage diagnostics 命名收口，并保留 legacy naming 兼容迁移。

## 2. Task Package

1. `TK-517` rename task-ledger sqlite canonical storage naming and migrate legacy naming（completed）
2. `TK-518` align cli durable-storage diagnostics docs and regression coverage with canonical task-ledger naming（completed）

## 3. Exit Criteria

1. 默认 task ledger sqlite 文件名已切到 `task-ledger.sqlite`。
2. canonical 表名已切到 `task_ledger_sources / task_ledger_rows`，legacy 表名仅承担兼容迁移职责。
3. `doctor / verify` 的 durable-storage check id 与 JSON 字段名已切到 canonical truth 语义。
4. review-chain managed ledger backfill、task-ledger runtime 与关键治理门禁验证通过。

## 4. Execution Notes

1. 本 sprint 只收口 naming 与 outward diagnostics，不回退 sqlite canonical truth 的主语义。
2. 兼容策略固定为“新命名默认生效，legacy 文件名/表名自动迁移或只读兼容”。
3. 在命名 clean-up 过程中补修了 `tasks.csv` 首次尚未落盘时的 render/backfill 回归，以保证 review 子链不因 naming clean-up 破链。
