# Decomposition Protocol Template

- Status: active
- Date: 2026-04-13
- Scope: project/sprint/task decomposition
- Owner: `project-008-workflow-optimization / TK-044`

## 1. Purpose

1. 标准化“总纲 -> project -> sprint -> task”拆解路径。
2. 让拆解结果可直接落到 `plan/checklist/tasks.csv/TK/CR/review`。
3. 避免任务卡、checklist 和 CSV 因自由发挥而持续漂移。

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

依赖解析补充规则：

1. task decomposition 阶段只解析“首跳正式输入”，不要求把所有潜在 DA 一次性塞进新任务。
2. 优先通过 canonical artifact registry 的候选查询收敛小集合，再决定哪些输入进入 `Required Inputs`。
3. 推荐命令：
   - `node ./scripts/governance/query-artifact-candidates.js --project <project-xxx> --task-title "<title>" --goal "<goal>" --limit 5`
4. 额外历史背景、audit、旧 handoff 与补充线索优先进入 `Traceback References`，而不是膨胀默认执行输入面。

## 3. Output Contract

每次拆解至少输出：

1. `project-xxx/plan.md`
2. `sprint-xxx/plan.md`
3. `sprint-xxx/tasks/checklist.md`
4. `sprint-xxx/tasks/tasks.csv`
5. `sprint-xxx/tasks/TK-xxx-*.md`
6. `sprint-xxx/tasks/CR-xxx-*.md`（命中 review workflow 时）
7. `sprint-xxx/review/.gitkeep`

Concrete scaffold/template sources:

1. `.repo-ai-governor/normative_knowledge_sources/governance/execution-stream-scaffold-template.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/project-plan-template.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/sprint-plan-template.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

plan 约束：

1. `project/sprint plan` 只承载 scope、里程碑、任务包概览与退出条件。
2. task-level status 以 `TK/CR + checklist` 驱动的 sqlite canonical ledger 最新记录为准；`tasks.csv` 只作为对应的 rendered view，不再在 plan 中重复维护逐任务状态矩阵。

## 4. Task Card Minimum Template

Concrete template source of truth:

1. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`
2. 生成新的 `TK-xxx` 或 `CR-xxx` 时，默认实例化 concrete template，而不是只参考本节的最小章节列表。

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
4. `Required Inputs` 中直接 `DA-*` 输入建议控制在 `1-3` 条，只保留首跳正式消费项。
5. `Development Verification` 默认写 Fast Gate 级验证；`Delivery Verification` 默认写 Release Gate 或切换为 `completed` 时必须补齐的交付验证。
6. 若任务暂无 `Traceback References` 或 `产出` 实际路径，章节仍需保留，并显式写 `不适用` / `待执行后补齐`，避免生成结果再次出现结构漂移。

## 5. Ledger Rules

1. sqlite canonical ledger 使用追加行记录状态演进，不覆盖历史行；`tasks.csv` 由 canonical truth 渲染。
2. `checklist.md` 保留勾选状态并在任务下追加执行轨迹摘要，不复制任务卡的长段计划与输入清单。
3. `tasks.csv` 只保留从 canonical truth 渲染出的机器审计必需字段，不承载完整 tracebacks，也不作为手工真值入口。
4. `TK` 与 `CR` 的状态、checklist 勾选、sqlite 最新 canonical 行与 rendered `tasks.csv` 必须一致；`TK` 终态为 `completed`，`CR` 终态为 `resolved`。
5. 推荐使用 `node ./scripts/governance/sync-task-ledger.js --task-id <TK-xxx|CR-xxx>` 来更新 sqlite canonical ledger 并回写派生视图，而不是手工分别编辑 checklist 和 CSV。
6. bootstrap 阶段允许先生成 `checklist.md` / `tasks.csv` 的 scaffold seed；但在 stream 正式进入 active execution 前，必须执行一次 `node ./scripts/governance/sync-task-ledger.js --tasks-dir <...>` 完成 canonical sqlite 对齐。
7. 多人并发拆解同一 `sprint` 时，应先通过 `node ./scripts/governance/reserve-task-id.js --tasks-dir <...> --type <TK|CR> --count <n>` 预留连续号段，再创建对应任务卡，避免多人同时猜测“下一个编号”。
8. 当某 sprint 下所有 `TK` 与 `CR` 均进入终态时，必须立即补入 closeout 任务，避免 active sprint 处于“全终态无 closeout”的悬空状态。
9. 新建或归一化 task card 后，建议运行 `node ./scripts/governance/check-task-required-inputs.js --tasks-dir <...>`，确保默认执行输入面没有被过量 DA/背景资料撑爆。

## 6. Exit Checklist

1. 所有 in-scope 任务均有明确状态。
2. 至少 1 份 task-level 产物或 verified review 产物可回链。
3. 依赖产物已登记到 artifact registry（符合登记规则时）。
4. 若实现任务与评审任务均进入终态，closeout 任务已创建或已执行。
5. `check-task-ledger-sync` 与 `check-sprint-plan-status-sync` 通过。
