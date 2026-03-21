# Task Ledger Single Write Source Contract

- Status: active
- Date: 2026-03-21
- Scope: execution ledger governance (`TK/checklist/tasks.csv`)
- Owner: `project-008-workflow-optimization / TK-042`

## 1. Purpose

1. 以 `TK` 作为台账主写入源，降低多点维护导致的漂移。
2. 保证 `CS-021` 在执行过程中可持续满足。

## 2. Canonical Source Rule

1. 任务语义主源：`tasks/TK-xxx*.md`。
2. 衍生台账：
   - `tasks/checklist.md`：任务状态可视化与执行轨迹摘要。
   - `tasks/tasks.csv`：机器可读执行记录与审计证据。

## 3. Minimum Canonical Fields

`TK` 必填字段：

1. `task_id`
2. `title`
3. `status`
4. `owner`
5. `priority`
6. `project`
7. `sprint`
8. `date`
9. `goal`（`## 1. 任务目标`）

`tasks.csv` 需与主源对齐字段：

1. `task_id/title/status/owner/priority/project/sprint/recorded_at/plan`

## 4. Sync Triggers

1. 任务创建：同步创建 checklist 条目与 planned 行。
2. 状态变更：追加新 execution 行（`in_progress/completed`）。
3. 任务完成：写入验证证据、review 变更、结果摘要。

## 5. Conflict Resolution

1. 若 `TK` 与 `tasks.csv` 冲突，以最新 `TK` 状态为准并回写 csv。
2. 若 checklist 勾选状态与 `tasks.csv` 不一致，以 `tasks.csv` 最新 canonical 行为准并修复 checklist。

## 6. Drift Governance

1. 每次状态切换后至少运行：
   - `node ./scripts/governance/check-task-ledger-sync.js`
   - `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. 漂移修复遵循“先修复主源，再修复衍生台账”。

## 7. Rollback

1. 自动同步失效时，临时切回人工同步，但必须保留漂移修复记录。
2. 回滚窗口结束后，需补齐自动同步缺失记录并重新核验。
