# Task Ledger Single Write Source Contract

- Status: active
- Date: 2026-04-04
- Scope: execution ledger governance (`TK/checklist/sqlite/tasks.csv`)
- Owner: `project-008-workflow-optimization / TK-042`

## 1. Purpose

1. 以 `TK` 作为台账主写入源，降低多点维护导致的漂移。
2. 保证 `CS-021` 在执行过程中可持续满足。

## 2. Canonical Source Rule

1. 任务语义主源：`tasks/TK-xxx*.md`。
2. 衍生台账：
   - `tasks/checklist.md`：任务状态可视化与执行轨迹摘要。
   - `context/dev/sqlite/task-ledger.sqlite`：默认机器可读 canonical execution ledger 与审计证据；兼容迁移窗口内允许从 legacy `task-ledger-projection.sqlite` 自动迁移。
   - `tasks/tasks.csv`：从 sqlite canonical truth 渲染的人类可读兼容视图。
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

sqlite canonical ledger 与 `tasks.csv` rendered view 需与主源对齐字段：

1. `task_id/title/status/owner/priority/project/sprint/recorded_at/plan`

## 3.1 Derived Ledger Responsibilities

1. `tasks/checklist.md` 只保留任务可视状态与少量执行轨迹摘要，不重复长段 `plan`、输入清单或 tracebacks。
2. sqlite canonical ledger 承载机器审计与状态演进必需字段，`tasks/tasks.csv` 只作为从 canonical truth 渲染出的兼容视图。
3. `project/sprint plan` 可以展示任务包 overview，但不得覆盖 `TK` 的 canonical status 与 goal。

## 3.2 Task Card Input Boundary

1. 新任务默认使用 `Required Inputs` 与 `Traceback References` 分层，而不是单一 `Input References`。
2. `Required Inputs` 只放执行必需输入，建议控制在 `3-5` 条。
3. `Traceback References` 只放追溯、审计、handoff 或历史规划类输入，不进入默认执行入口。
4. 既有任务卡保留 `Input References` 兼容；迁移过程中以运行时与人工执行双兼容为准。
5. 新任务卡的 concrete skeleton 以 `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md` 为准；`decomposition-protocol-template.md` 只保留最小章节约束。

## 3.3 Sync Mechanism Boundary

1. `scripts/governance/sync-task-ledger.js` 是推荐的派生台账同步器，用于从 canonical `TK` 更新 sqlite canonical ledger，并回写 `checklist.md` 与 `tasks.csv` rendered view。
2. project/sprint plan 只保留任务包概览、目标与里程碑，不再重复维护 task-level status 矩阵。
3. 若任务需要在不改动 canonical `TK` 状态的前提下回填 review/verify 审计字段，允许同步器为 sqlite canonical ledger 追加新行，并同步渲染新的 `tasks.csv` 视图，同时在 checklist 追加执行摘要。

## 4. Sync Triggers

1. 任务创建：同步创建 checklist 条目、sqlite canonical planned 行与 rendered `tasks.csv`。
2. 状态变更：向 sqlite canonical ledger 追加新 execution 行（`in_progress/completed`），并重渲染 `tasks.csv`。
3. 任务完成：写入验证证据、review 变更、结果摘要。
4. review/verify 子链若命中 managed ledger backfill，可通过同步器自动回填 checklist/tasks.csv，而不再要求手工消费 pending artifact。

## 5. Conflict Resolution

1. 若 `TK` 与 sqlite canonical ledger 冲突，以最新 `TK` 状态为准并通过同步器回写 sqlite/csv。
2. 若 checklist 勾选状态与 `tasks.csv` 不一致，以 sqlite canonical ledger 的最新行语义为准并修复 checklist/CSV 视图。

## 6. Drift Governance

1. 每次状态切换后至少运行：
   - `node ./scripts/governance/sync-task-ledger.js --task-id <TK-xxx>`（推荐，在 task-aware 执行流中）
   - `node ./scripts/governance/check-task-ledger-sync.js`
   - `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. 漂移修复遵循“先修复主源，再修复衍生台账”。

## 7. Rollback

1. 自动同步失效时，临时切回人工同步，但必须保留漂移修复记录。
2. 回滚窗口结束后，需补齐自动同步缺失记录并重新核验。
