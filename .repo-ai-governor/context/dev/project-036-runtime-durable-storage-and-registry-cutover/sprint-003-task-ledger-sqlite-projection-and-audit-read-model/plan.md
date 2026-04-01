# sprint-003-task-ledger-sqlite-projection-and-audit-read-model 计划

- Status: planned
- Date: 2026-04-02
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint Goal: 为 `tasks.csv` 建立 sqlite projection/read-model，并让 audit/query/UI consumer 优先读取该 read-model。

## 1. Task Package

1. `TK-478` build tasks.csv sqlite projection and route audit/query consumers through it

## 2. Exit Criteria

1. `tasks.csv` 仍保持 human-readable canonical source。
2. sqlite projection/read-model 可由 `tasks.csv` 全量重建或增量同步。
3. 审计、统计、查询与 UI 检索 consumer 可优先读 sqlite projection，而不是重新解析 CSV。

## 3. Milestones

1. 2026-04-02：创建 planned `sprint-003`，冻结 `TK-478` 作为 task ledger sqlite projection implementation package。
