# sprint-001-task-ledger-canonical-truth-and-rendered-csv-views 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-040-task-ledger-sqlite-canonical-truth-cutover`

## 1. Sprint Goal

将 task ledger 从 `tasks.csv` canonical source 切换为 sqlite canonical truth，并保留 rendered `tasks.csv` 兼容视图与既有 governance gate。

## 2. Task Package

1. `TK-514` activate project-040 and switch task-ledger execution surface（completed）
2. `TK-515` cut over task ledger to sqlite canonical truth and rendered csv views（completed）
3. `TK-516` align governance contracts plan-ledger seams and regression coverage with sqlite canonical task ledger（completed）

## 3. Exit Criteria

1. sqlite canonical ledger 已承担 task ledger 真值职责。
2. `sync-task-ledger` 与 task-ledger consumer 不再把 `tasks.csv` 当主真值。
3. `tasks.csv` 仍可作为 rendered compatibility view 供人类审阅和 diff。
4. task-ledger、sprint-status、artifact-lifecycle 与 delivery-registry 相关门禁仍通过。

## 4. Execution Notes

1. 本 sprint 直接承接 `project-036 sprint-003` 的 projection baseline，但不再满足于 read-model；目标是完成 canonical truth cutover。
2. 第一优先级是收口 `task-ledger-projection.js` 与 `sync-task-ledger.js` 的写/读路径，再同步 formal docs。
3. 由于用户明确要求“先改一下”，本轮以最小完整切换为目标，不额外扩大到 task-ledger DB 命名 clean-up。
4. 2026-04-04：命名 clean-up 与 CLI 诊断对齐已在 follow-up `sprint-002-canonical-naming-cleanup-and-diagnostics-alignment` 中完成收口。
