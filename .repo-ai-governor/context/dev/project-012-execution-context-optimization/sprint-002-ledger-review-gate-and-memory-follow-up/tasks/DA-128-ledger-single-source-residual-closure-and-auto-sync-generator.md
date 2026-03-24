# DA-128 `TK` 单写源残余收口与自动同步生成器

- Status: active
- Date: 2026-03-24
- Source Task: `TK-130`
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-002-ledger-review-gate-and-memory-follow-up`

## 1. 交付摘要

本轮将 `TK` 单写源从“靠 contract + gate 提醒人工回写”推进到了“由同步器回写派生台账”的状态。

## 2. 关键变化

1. 新增 `scripts/governance/sync-task-ledger.js`，可按 `taskId` 或 active primary stream 从 canonical `TK` 同步 `checklist.md` 与 `tasks.csv`。
2. checklist 现在只保留任务可视状态与执行摘要；任务 headline 由 `TK` 标题与状态派生，执行摘要保留在 checklist 子项。
3. `tasks.csv` 的最新 canonical 行在缺失、字段漂移或 review/verify 补充字段变更时由同步器追加，不再要求手工对齐每一列。
4. `project-012` 的 project/sprint plan 已去掉 task-level status 矩阵，明确 status source 由 sprint ledger 提供。

## 3. 证据路径

1. `scripts/governance/sync-task-ledger.js`
2. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
4. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/plan.md`
5. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-002-ledger-review-gate-and-memory-follow-up/plan.md`

## 4. 结论

分析稿 `6.3 / P0` 中“从 `TK` 自动同步 `checklist/tasks.csv`”的缺口已完成收口，project/sprint plan 里的 task-level 重复状态表达也已显式退出主源角色。
