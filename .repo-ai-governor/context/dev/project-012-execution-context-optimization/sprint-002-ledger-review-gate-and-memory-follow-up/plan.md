# sprint-002-ledger-review-gate-and-memory-follow-up 计划

- Status: completed
- Date: 2026-03-24
- Project: `project-012-execution-context-optimization`

## 1. Sprint Goal

收口分析稿里“部分完成 + 未完成”的 `TK` 单写源、review 子链、gate 分层与 runtime selective memory 注入议题，并完成 project-012 的二次收尾。

## 2. In-Scope Tasks

1. TK-130 `TK` 单写源残余收口与自动同步生成器
2. TK-131 review 子链受控内联与状态抽象收口
3. TK-132 gate 分层模板化与开发/交付验证契约
4. TK-133 runtime memory 选择性注入与依赖定向快照
5. TK-134 sprint-002 出口验收与 project-012 二次收尾

任务状态说明：

1. 本 sprint 的 task-level status 以 `tasks/TK-xxx.md` 与 `tasks/tasks.csv` 最新 canonical 行为准。
2. 本计划只保留 in-scope 任务包与 exit criteria，不重复维护逐任务状态矩阵。

## 3. Entry Criteria

1. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md` 中 P0-P2 核验结论已明确。
2. `DA-124`~`DA-127` 与 `project-012` 首轮 completion audit summary 可检索。
3. `project-010 / sprint-002` 的 task-driven mainchain 与 `TK-100` 规划输入可检索。
4. `execution-gate-layering-spec`、task-ledger contract 与 `packages/core-memory` 当前实现可复跑核验。

## 4. Exit Criteria

1. `TK` 单写源的残余“人工回写”口径得到进一步收口。
2. review 子链进入自动主链或等价受控状态表达，不再只暴露串命令心智模型。
3. Fast Gate / Release Gate 进入任务模板与交付语义。
4. runtime memory/context 注入具备选择性查询与装配路径。
5. 形成 `DA-128`~`DA-132` 并完成 project-012 的二次完成态审计摘要。
