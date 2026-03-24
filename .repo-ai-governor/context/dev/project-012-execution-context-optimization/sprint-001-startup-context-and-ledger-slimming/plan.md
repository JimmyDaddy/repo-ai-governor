# sprint-001-startup-context-and-ledger-slimming 计划

- Status: completed
- Date: 2026-03-24
- Project: `project-012-execution-context-optimization`

## 1. Sprint Goal

完成默认启动加载、`current-context` 活跃流表达、`TK` 台账单写源语义与任务模板输入边界的第一轮瘦身收口。

## 2. In-Scope Tasks

1. TK-126 启动基线与规范加载分层对齐（completed）
2. TK-127 `current-context` 活跃流瘦身与历史索引分层（completed）
3. TK-128 `TK` 单写源与任务模板输入收紧（completed）
4. TK-129 sprint-001 出口验收与 rollout 输入约束（completed）

## 3. Entry Criteria

1. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md` 可检索。
2. `project-008` 的 workflow optimization 基线可检索，尤其是 gate layering 与 task-ledger single-source 相关约束。
3. 当前主执行流 `project-010` 与已完成的 `project-011` 可作为上下文增长与 rollout 的回归样本。
4. 当前 gate 脚本和 `current-context` 解析逻辑可复跑，便于校验瘦身后不引入执行漂移。

## 4. Exit Criteria

1. 默认启动加载规则与 manifest 分层语义对齐。
2. `current-context` 的 active/history 分层与脚本消费边界完成最小闭环。
3. `TK/checklist/tasks.csv` 与任务模板的最小必需任务语义更清晰，默认输入引用收敛。
4. 形成 `DA-124`~`DA-127` 并通过台账与治理门禁。
