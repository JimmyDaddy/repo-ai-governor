# Repo AI Governor 工作推进流程优化建议（建议版）

- Status: advisory
- Date: 2026-03-21
- Purpose: identify optimization opportunities for the current delivery workflow without changing active rules immediately
- Basis:
  - `AGENTS.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. 使用说明

1. 本文档只提供优化建议，不直接修改现有执行规则。
2. 后续若采纳某条建议，应先建立独立任务，再进入规则和实现变更。
3. 建议优先按“高收益/低改动”顺序推进，避免流程治理本身成为交付阻塞。

## 2. 现状判断

当前流程已经具备较强治理基础：

1. 有清晰的 triad 文档事实链路和同步规则。
2. 有任务、评审、验证、交付记录的标准化路径。
3. 有统一门禁命令和长期维护基线。
4. 有工具级“从 0 到完成态”的总执行计划。

当前主要优化空间不在“缺流程”，而在：

1. 执行成本仍偏高（多处手工同步、认知负担较大）。
2. 反馈分层不够清晰（快反馈与完整门禁未明显分流）。
3. 状态切换标准可进一步量化（减少主观差异）。

## 3. 优先级路线图（高收益 -> 高复杂度）

| 建议 ID | 建议主题 | 预期收益 | 实施成本 | 优先级 |
|---|---|---|---|---|
| O1 | 门禁分层（快速门禁 vs 完整门禁） | 高 | 低 | P0 |
| O2 | 台账单一写入源（自动生成 checklist/csv） | 高 | 中 | P0 |
| O3 | CR 状态切换阈值标准化 | 高 | 低 | P0 |
| O4 | 风险判定触发规则量化（HITL SLA） | 高 | 中 | P0 |
| O5 | 计划拆解模板化（project/sprint/task 生成协议工具化） | 高 | 中 | P1 |
| O6 | 关键路径可视化（weekly execution board） | 中高 | 低 | P1 |
| O7 | 规则变更影响评估模板（pre-change impact review） | 中 | 低 | P1 |
| O8 | 依赖脚本 warning -> blocking 的阶段化策略 | 中高 | 中 | P1 |
| O9 | 复盘闭环标准化（每 sprint 固定输出） | 中 | 低 | P1 |
| O10 | 交付指标体系统一（质量/效率/风险） | 高 | 中高 | P2 |
| O11 | 自动化流程编排看板（长期） | 高 | 高 | P2 |

## 4. 重点建议（可直接进入评审）

### O1 门禁分层（快速门禁 vs 完整门禁）

问题：

1. 同一轮开发中，局部修改和交付前验证都走重门禁，反馈时间长。

建议：

1. 建立两层门禁：
   - Fast Gate（本地高频）：类型检查、关键规则检查、定向测试。
   - Release Gate（交付前）：全量治理脚本 + 包级测试 + 集成测试 + 发布检查。

收益：

1. 降低开发等待时间。
2. 保持交付质量下限不下降。

### O2 台账单一写入源

问题：

1. 当前 `TK`、`checklist.md`、`tasks.csv` 多点同步，容易漂移。

建议：

1. 定义“任务卡（TK）为主写入源”，通过脚本自动生成/更新 `checklist` 与 `tasks.csv` 标准字段。
2. 保留人工补充执行记录，但标准字段自动对齐。

收益：

1. 显著降低维护成本。
2. 直接减少 `CS-021` 漂移类问题。

### O3 CR 状态切换阈值标准化

问题：

1. `review -> verified -> resolved` 状态切换标准目前偏依赖执行者判断。

建议：

1. 增加状态进入条件模板：
   - 进入 `verified`：至少完成逐条复核结论 + 证据命令记录。
   - 进入 `resolved`：所有接受项有执行记录，且无阻塞项残留。

收益：

1. 降低评审状态分歧。
2. 提高 CR 生命周期可预测性。

### O4 风险触发规则量化（HITL SLA）

问题：

1. 高风险场景已定义，但触发与响应标准还可更量化。

建议：

1. 为高风险类型增加明确阈值和响应 SLA：
   - 风险等级映射规则。
   - 默认动作（confirm/escalate/block）。
   - 人工响应超时策略（超时回退或阻断）。

收益：

1. 提高自动模式稳定性。
2. 降低“策略执行看人”的不确定性。

### O5 计划拆解模板化工具化

问题：

1. 现在有总纲和模板，但拆解过程仍高度人工。

建议：

1. 基于 master plan 建一个拆解助手：
   - 输入：目标 workstream + phase + step。
   - 输出：project/sprint/task 草案骨架（含验收与验证字段）。

收益：

1. 提高计划拆解速度和一致性。
2. 避免重复性规划劳动。

## 5. 分阶段落地建议（仅建议，不实施）

### Phase P0（建议 1-2 周）

1. O1 门禁分层方案评审。
2. O3 CR 切换阈值标准定义。
3. O6 每周关键路径看板模板。

### Phase P1（建议 2-4 周）

1. O2 台账单一写入源方案评审。
2. O4 风险触发量化规则评审。
3. O5 拆解模板化方案评审。
4. O8 warning -> blocking 切换策略。

### Phase P2（建议 4 周以上）

1. O10 指标体系统一。
2. O11 自动化流程看板和执行编排可视化。

## 6. 建议的评审决策顺序

1. 先评审 O1/O3（低改动高收益）。
2. 再评审 O2/O4/O5（涉及执行机制变化）。
3. 最后评审 O10/O11（平台化建设，投入较大）。

## 7. 建议的采纳准则

一条优化建议建议被采纳前，至少满足：

1. 不破坏 triad 文档事实链路。
2. 不增加执行路径中的强制人工步骤数量。
3. 可通过脚本或门禁验证“优化后比优化前更稳定”。
4. 对现有 active 任务影响可控且可回滚。
