# Decomposition Protocol Template

- Status: active
- Date: 2026-03-28
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

plan 约束：

1. `project/sprint plan` 只承载 scope、里程碑、任务包概览与退出条件。
2. task-level status 以 `TK/checklist` 驱动的 sqlite canonical ledger 最新记录为准；`tasks.csv` 只作为对应的 rendered view，不再在 plan 中重复维护逐任务状态矩阵。

## 4. Task Card Minimum Template

Concrete template source of truth:

1. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`
2. 生成新的 `TK-xxx` 时，默认实例化 concrete template，而不是只参考本节的最小章节列表。

1. 元数据：`Status/Date/Owner/Priority/Project/Sprint`
2. `## 1. 任务目标`
3. `## 2. Depends On`
4. `## 3. 预期产物`
5. `## 4. Required Inputs`
6. `## 5. Traceback References`
7. `## 6. 实施计划`
8. `## 7. Development Verification`
9. `## 8. Delivery Verification`
10. `## 9. 执行记录`
11. `## 10. 产出`

兼容说明：

1. 既有任务卡允许继续使用 `## 4. Input References`。
2. 新任务默认采用 `Required Inputs + Traceback References`，把执行必需输入与追溯输入分开。
3. `Required Inputs` 建议控制在 `3-5` 条；超出时优先把历史规划、handoff、completion audit 移到 `Traceback References`。
4. `Development Verification` 默认写 Fast Gate 级验证；`Delivery Verification` 默认写 Release Gate 或切换为 `completed` 时必须补齐的交付验证。
5. 若任务暂无 `Traceback References` 或 `产出` 实际路径，章节仍需保留，并显式写 `不适用` / `待执行后补齐`，避免生成结果再次出现结构漂移。

## 5. Ledger Rules

1. sqlite canonical ledger 使用追加行记录状态演进，不覆盖历史行；`tasks.csv` 由 canonical truth 渲染。
2. `checklist.md` 保留勾选状态并在任务下追加执行轨迹摘要，不复制任务卡的长段计划与输入清单。
3. `tasks.csv` 只保留从 canonical truth 渲染出的机器审计必需字段，不承载完整 tracebacks，也不作为手工真值入口。
4. `TK` 状态、checklist 勾选、sqlite 最新 canonical 行与 rendered `tasks.csv` 必须一致。
5. 推荐使用 `node ./scripts/governance/sync-task-ledger.js --task-id <TK-xxx>` 来更新 sqlite canonical ledger 并回写派生视图，而不是手工分别编辑 checklist 和 CSV。

## 6. Exit Checklist

1. 所有 in-scope 任务均有明确状态。
2. 至少 1 份 verified review 产物可回链。
3. 依赖产物已登记到 artifact registry（符合登记规则时）。
4. `check-task-ledger-sync` 与 `check-sprint-plan-status-sync` 通过。
