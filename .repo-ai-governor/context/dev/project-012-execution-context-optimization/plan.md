# project-012-execution-context-optimization 计划

- Status: completed
- Date: 2026-03-24
- Stage Mapping: Cross-Stage workflow optimization follow-up
- Phase Mapping: Context Efficiency / Governance Simplification

## 1. 目标

1. 降低“执行一个任务”时的默认上下文长度，同时保持治理正确性、可追溯性和门禁稳定性。
2. 对齐 agent 启动基线与 `normative-loading-manifest` 的分层加载策略，避免默认重加载。
3. 将 `current-context`、`TK/checklist/tasks.csv`、任务模板和 gate 使用边界进一步收敛到“当前任务最小必需信息”。
4. 为 `project-010` 及后续执行流提供更轻量、更稳定的仓库级执行入口。

## 2. 工作流分解（Workstreams）

1. WS-01 Startup Baseline Alignment
   - 对齐 `AGENTS.md`、maintenance guide 与 `normative-loading-manifest` 的默认启动语义。
   - 收敛 L0 默认加载与 L1 按需补载边界。
2. WS-02 Active Stream Context Slimming
   - 瘦身 `current-context.md`。
   - 将 completed streams 与 active streams 分层治理。
3. WS-03 Ledger Single-Source Tightening
   - 让 `TK` 更接近真实 canonical source。
   - 进一步降低 `plan/checklist/tasks.csv` 的重复任务语义。
4. WS-04 Task Template Input Narrowing
   - 收紧任务卡输入引用。
   - 明确执行必需输入与 traceback 输入边界。
5. WS-05 Rollout Backfeed
   - 将优化结论回灌给当前主执行流与后续项目模板。
   - 形成可复用的上下文治理约束。

## 2.1 优先级（P0/P1）

1. P0-1 启动基线与规范加载分层对齐（`TK-126`）
   - 先收敛默认启动上下文，避免每次任务进入都读过多 L1 文档。
2. P0-2 `current-context` 活跃流瘦身与历史索引分层（`TK-127`）
   - 解决 active stream 文件长期携带 completed streams 的问题。
3. P0-3 `TK` 单写源与任务模板输入收紧（`TK-128`）
   - 降低任务级文档包重复度与默认阅读范围。
4. P0-4 sprint-001 出口验收与 rollout 输入约束（`TK-129`）
   - 将优化结论冻结为可持续执行的输入约束。
5. P1-1 review/gate 上下文收口（后续规划输入）
   - 将 review 子链和 gate 分层进一步收敛到任务模板与运行时语义中。
6. P1-2 runtime 选择性 memory 注入（后续规划输入）
   - 为任务驱动 DAG 与 artifact dependency resolver 提前准备更轻量的上下文装配路径。

## 3. Sprint 细化

## 3.1 sprint-001-startup-context-and-ledger-slimming

- Sprint Goal: 先完成默认启动加载、active stream 表达、`TK` 台账与任务模板四个高频入口的 P0 收敛，建立上下文瘦身的第一轮可执行基线。
- 任务包：`TK-126`、`TK-127`、`TK-128`、`TK-129`。
- Exit Criteria:
  1. agent 默认启动基线与 `normative-loading-manifest` 的 L0/L1 语义对齐。
  2. `current-context.md` 的活跃流表达与历史流表达完成分层，并同步脚本消费边界。
  3. `TK/checklist/tasks.csv` 与任务模板的最小必需字段和输入边界得到进一步收敛。
  4. 形成 `DA-124`~`DA-127` 四项产物并通过台账与治理门禁。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-126 | sprint-001 | 启动基线与规范加载分层对齐 | implementation/governance | `.repo-ai-governor/draft/task-execution-context-growth-analysis.md` | completed |
| TK-127 | sprint-001 | `current-context` 活跃流瘦身与历史索引分层 | implementation/context | TK-126 | completed |
| TK-128 | sprint-001 | `TK` 单写源与任务模板输入收紧 | implementation/governance | TK-126,TK-127 | completed |
| TK-129 | sprint-001 | sprint-001 出口验收与 rollout 输入约束 | acceptance baseline | TK-126,TK-127,TK-128 | completed |

## 5. 依赖产物策略

1. project-012 启动入口默认消费：
   - `.repo-ai-governor/draft/task-execution-context-growth-analysis.md`
   - `project-008` 的流程优化基线产物
   - 当前主执行流 `project-010` 的 task/context 样本
2. sprint-001 产物目标：`DA-124`~`DA-127`。
3. 所有上下文瘦身改动必须优先保持 canonical source 与 gate 可执行性，不以“少文档”为代价破坏治理闭环。
4. 若某项优化会改变默认启动入口，应在同一变更窗口同步更新 `current-context`、`projects-overview`、`dev index` 与相关规范入口。

## 6. DoD（project-012）

1. 默认启动上下文遵循 manifest 分层语义，不再无差别要求所有任务加载 L1。
2. `current-context` 的活跃流和历史流分层治理已建立，completed streams 不再默认挤入当前任务入口。
3. `TK` 的 canonical source 角色得到进一步落地，派生台账的重复任务语义减少。
4. 任务模板对执行必需输入与 traceback 输入的边界更清晰。
5. 所有优化仍满足 `CS-021/CS-025/CS-026` 等相关治理约束。

## 7. 里程碑记录

1. 2026-03-24：创建 `project-012`，将“任务执行上下文增长分析”正式转化为独立优化主线，并切换为当前 primary stream。
2. 2026-03-24：完成 `TK-126` 第一轮收口，将 `AGENTS` 与 maintenance guide 的默认启动语义对齐到 manifest 驱动的 `L0 默认加载 + L1 按需补载` 基线。
3. 2026-03-24：完成 `TK-127`，将 `current-context` 收敛为 primary 与 active parallel streams 默认入口，并把 completed streams 迁移到独立 history index。
4. 2026-03-24：完成 `TK-128`，明确 `TK` canonical source 边界，收紧任务卡为 `Required Inputs + Traceback References`，并让 CLI runtime 保持新旧双兼容。
5. 2026-03-24：完成 `TK-129`，产出 `DA-127`，冻结 sprint-001 出口验收与后续 rollout 输入约束。
6. 2026-03-24：project-012 完成态审计摘要：`.repo-ai-governor/context/dev/project-012-execution-context-optimization/project-012-execution-context-optimization-completion-audit-summary.md`。
