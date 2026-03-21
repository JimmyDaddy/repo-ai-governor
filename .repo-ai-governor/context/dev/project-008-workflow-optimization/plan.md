# project-008-workflow-optimization 计划

- Status: completed
- Date: 2026-03-21
- Stage Mapping: Cross-Stage Execution Governance
- Phase Mapping: Process Optimization

## 1. 目标

1. 将流程优化建议落地为可执行工作包，优先降低执行成本并提升反馈速度。
2. 建立 `Fast Gate/Release Gate` 分层、CR 状态阈值、风险判定契约与 HITL SLA 基线。
3. 将任务台账治理从多点同步改造为“单一写入源 + 自动对齐”机制。
4. 形成可复用的 project/sprint/task 拆解协议，支撑后续规模化任务分解。

## 2. 工作流分解（Workstreams）

1. WS-01 Gate Layering
   - 门禁分层与触发规则。
   - 快反馈与完整交付验证分离。
2. WS-02 CR Lifecycle Governance
   - `review -> verified -> resolved` 进入阈值模板。
   - 审核证据与状态切换一致性。
3. WS-03 Ledger Single Source
   - 以 `TK` 为主写入源。
   - 自动同步 `checklist/tasks.csv` 标准字段。
4. WS-04 Risk Contract + HITL SLA
   - 统一风险事实结构。
   - `allow/confirm/block/escalate` 动作映射与超时策略。
5. WS-05 Decomposition Protocol
   - project/sprint/task 生成协议化模板。
   - 与现有 AGENTS 命名和路径规则对齐。
6. WS-06 Stabilization and Adoption
   - sprint 复盘、周看板、采纳准则与滚动改进入口。

## 3. Sprint 细化

## 3.1 sprint-001-execution-workflow-optimization

- Sprint Goal: 交付流程优化首轮治理基线，形成可执行、可验证、可回滚的流程治理方案。
- 任务包：`TK-040`、`TK-041`、`TK-042`、`TK-043`、`TK-044`、`TK-045`。
- Exit Criteria:
  1. 门禁分层、CR 阈值、风险契约三项规范形成可评审版本并可执行验证。
  2. 台账单一写入源与拆解协议模板形成可落地实施输入。
  3. 形成 sprint-001 出口验收与后续 rollout 输入约束清单。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-040 | sprint-001 | 门禁分层（Fast Gate/Release Gate）基线 | baseline/policy | 无 | completed |
| TK-041 | sprint-001 | CR 生命周期阈值模板基线 | baseline/template | TK-040 | completed |
| TK-042 | sprint-001 | 台账单一写入源契约与同步机制设计 | baseline/contract | TK-040 | completed |
| TK-043 | sprint-001 | 风险判定事实契约与 HITL SLA 基线 | baseline/contract | TK-040 | completed |
| TK-044 | sprint-001 | project/sprint/task 拆解助手协议模板 | baseline/template | TK-041,TK-042 | completed |
| TK-045 | sprint-001 | sprint-001 出口验收与后续 rollout 输入约束 | acceptance baseline | TK-041,TK-042,TK-043,TK-044 | completed |

## 5. 依赖产物策略

1. 本项目启动默认消费 `.repo-ai-governor/normative_knowledge_sources/archive/repo-ai-governor-workflow-optimization-recommendations.md`（执行版，已归档）。
2. sprint-001 预期产物编号：`DA-051`~`DA-056`。
3. 任务执行时统一使用 `artifact_id + artifact_path` 双键回链，避免跨任务引用歧义。

## 6. DoD（project-008）

1. 流程优化规范具备明确执行步骤、验收标准与回滚策略。
2. 门禁、CR、风险、台账、拆解协议五类机制均可映射到任务级执行。
3. 项目任务台账与评审生命周期路径满足 `CS-021`，无 `task card/checklist/tasks.csv` 漂移。
4. 不破坏 triad 文档事实链路，不增加非必要强制人工步骤。

## 7. 里程碑记录

1. 2026-03-21：`project-008` 完成态审计摘要：
   - `.repo-ai-governor/context/dev/project-008-workflow-optimization/project-008-workflow-optimization-completion-audit-summary.md`
