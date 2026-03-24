# Decomposition Protocol Template

- Status: active
- Date: 2026-03-21
- Scope: project/sprint/task decomposition
- Owner: `project-008-workflow-optimization / TK-044`

## 1. Purpose

1. 标准化“总纲 -> project -> sprint -> task”拆解路径。
2. 让拆解结果可直接落到 `plan/checklist/tasks.csv/TK/review`。

## 2. Input Contract

必填输入：

1. `workstream`
2. `phase_or_stage`
3. `goal`
4. `constraints`
5. `dependencies`

推荐输入：

1. `risk_level`
2. `acceptance_signals`
3. `rollback_point`

## 3. Output Contract

每次拆解至少输出：

1. `project-xxx/plan.md`
2. `sprint-xxx/plan.md`
3. `sprint-xxx/tasks/checklist.md`
4. `sprint-xxx/tasks/tasks.csv`
5. `sprint-xxx/tasks/TK-xxx-*.md`
6. `sprint-xxx/review/.gitkeep`

## 4. Task Card Minimum Template

1. 元数据：`Status/Date/Owner/Priority/Project/Sprint`
2. `## 1. 任务目标`
3. `## 2. Depends On`
4. `## 3. 预期产物`
5. `## 4. Required Inputs`
6. `## 5. Traceback References`
7. `## 6. 实施计划`
8. `## 7. 验证`
9. `## 8. 执行记录`
10. `## 9. 产出`

兼容说明：

1. 既有任务卡允许继续使用 `## 4. Input References`。
2. 新任务默认采用 `Required Inputs + Traceback References`，把执行必需输入与追溯输入分开。
3. `Required Inputs` 建议控制在 `3-5` 条；超出时优先把历史规划、handoff、completion audit 移到 `Traceback References`。

## 5. Ledger Rules

1. `tasks.csv` 使用追加行记录状态演进，不覆盖历史行。
2. `checklist.md` 保留勾选状态并在任务下追加执行轨迹摘要，不复制任务卡的长段计划与输入清单。
3. `tasks.csv` 只保留机器审计必需字段，不承载完整 tracebacks。
4. `TK` 状态、checklist 勾选、csv 最新 canonical 行必须一致。

## 6. Exit Checklist

1. 所有 in-scope 任务均有明确状态。
2. 至少 1 份 verified review 产物可回链。
3. 依赖产物已登记到 artifact registry（符合登记规则时）。
4. `check-task-ledger-sync` 与 `check-sprint-plan-status-sync` 通过。
