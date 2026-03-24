# Task Ledger Single Write Source Contract

- Status: active
- Date: 2026-03-24
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
3. `project-xxx/plan.md` 与 `sprint-xxx/plan.md` 仅承载范围、里程碑和任务包概览；它们不是 task-level status 的主写入源。

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

## 3.1 Derived Ledger Responsibilities

1. `tasks/checklist.md` 只保留任务可视状态与少量执行轨迹摘要，不重复长段 `plan`、输入清单或 tracebacks。
2. `tasks/tasks.csv` 只保留机器审计与状态演进必需字段，不复制完整依赖包、历史 handoff 或长篇追溯说明。
3. `project/sprint plan` 可以展示任务包 overview，但不得覆盖 `TK` 的 canonical status 与 goal。

## 3.2 Task Card Input Boundary

1. 新任务默认使用 `Required Inputs` 与 `Traceback References` 分层，而不是单一 `Input References`。
2. `Required Inputs` 只放执行必需输入，建议控制在 `3-5` 条。
3. `Traceback References` 只放追溯、审计、handoff 或历史规划类输入，不进入默认执行入口。
4. 既有任务卡保留 `Input References` 兼容；迁移过程中以运行时与人工执行双兼容为准。

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
