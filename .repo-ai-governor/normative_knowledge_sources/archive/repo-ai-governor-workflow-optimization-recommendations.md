# Repo AI Governor 工作推进流程优化实施计划（执行版）

- Status: archived
- Date: 2026-03-21
- Purpose: convert workflow optimization recommendations into an executable implementation program
- Workspace mode baseline: `repo_local` (`<repo>/.repo-ai-governor`)
- Basis:
  - `AGENTS.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. 目标与范围

### 1.1 本计划要解决的问题

1. 反馈链路偏慢：开发中和交付前门禁未分层。
2. 台账维护成本高：`TK/checklist/tasks.csv` 多点同步容易漂移。
3. 评审状态标准不统一：`review -> verified -> resolved` 进入条件可解释性不足。
4. HITL 触发不够量化：高风险判定与人工响应 SLA 缺少统一执行契约。
5. 拆解仍依赖人工经验：缺少可复用的项目/迭代/任务生成协议。

### 1.2 本计划不做的事（当前周期）

1. 不改动产品核心目标与 triad 文档事实链路。
2. 不引入组织级云控制平面或全量可视化编排平台。
3. 不在首轮就把所有 warning 规则切换为 blocking。

## 2. 实施优先级与里程碑

| 里程碑 | 周期 | 目标 | 产出 |
|---|---|---|---|
| M0 Kickoff | Week 0 | 对齐方案、冻结范围、建立任务台账 | 项目计划、任务包、风险清单 |
| M1 Quick Wins | Week 1-2 | 落地低改动高收益项（O1/O3/O6） | 门禁分层方案、CR 阈值规范、周看板模板 |
| M2 Core Mechanism | Week 3-5 | 落地机制类改造（O2/O4/O5/O8） | 台账单一写源、风险契约、拆解助手、阶段化门禁策略 |
| M3 Stabilization | Week 6-8 | 稳定运行并建立度量（O9/O10） | 复盘模板、指标仪表定义、门禁稳定性报告 |
| M4 Long-term Enablement | Week 9+ | 可视化编排与自动化增强（O11） | 自动化看板 PoC 与接入路线 |

## 3. 工作包分解（可直接拆任务）

### WP-01 门禁分层（对应 O1）

目标：

1. 将验证流程拆分为 `Fast Gate` 与 `Release Gate`，减少开发等待。

实施项：

1. 定义 `Fast Gate` 命令集合（类型检查 + 关键治理 + 定向测试）。
2. 定义 `Release Gate` 命令集合（全量治理 + 包级测试 + 集成测试 + 发布检查）。
3. 明确本地/CI 触发策略和失败处理策略。

验收标准（DoD）：

1. 文档明确两层门禁命令、触发时机、失败动作。
2. 任一任务可明确判断“当前应跑 Fast 还是 Release”。
3. 发布前仍满足 `code_standards.md` 的完整验证链路。

回滚策略：

1. 若分层后遗漏风险，临时回退为“所有交付节点必须执行 Release Gate”。

### WP-02 台账单一写入源（对应 O2）

目标：

1. 以 `TK` 为主写入源，自动同步 `tasks/checklist.md` 与 `tasks/tasks.csv` 标准字段。

实施项：

1. 定义 `TK` 最小字段契约（`task_id/title/owner/priority/status/project/sprint/plan/recorded_at`）。
2. 设计台账同步脚本接口与执行时机（创建任务、状态变更、收尾）。
3. 建立漂移检测和修复流程（与 `CS-021` 对齐）。

验收标准（DoD）：

1. 新任务创建后可自动得到一致的 checklist/csv 标准字段。
2. 漂移可被门禁脚本识别，并给出自动修复建议。
3. 人工仅维护执行记录增量，不再重复维护标准字段。

回滚策略：

1. 若自动同步异常，切回“手工记录 + 强制漂移检查”并保留问题日志。

### WP-03 CR 状态阈值标准化（对应 O3）

目标：

1. 固化 `review/verified/resolved` 的进入条件，减少主观差异。

实施项：

1. 定义状态进入清单模板：
   - `review -> verified`：逐条复核结论 + 证据命令。
   - `verified -> resolved`：接受项执行完成 + 阻塞项清零/豁免登记。
2. 将模板映射到 review 文档结构与命名动作。
3. 增加 CR 生命周期检查清单。

验收标准（DoD）：

1. 任一 CR 文件可依据模板明确判断当前状态是否合规。
2. 同一变更由不同执行者评估，状态结论一致性提升。

回滚策略：

1. 若模板过重影响效率，保留核心强制项，非关键项降级为建议项。

### WP-04 风险判定契约 + HITL SLA（对应 O4）

目标：

1. 建立统一风险判定结构和动作映射，稳定 `allow/confirm/block/escalate` 决策。

实施项：

1. 定义风险事实结构（建议字段）：
   - `risk_id/risk_category/risk_level/evidence/change_scope/confidence/trigger_rule`.
2. 定义风险等级到动作映射：
   - `L1 -> allow`
   - `L2 -> confirm`
   - `L3 -> escalate`
   - `L4 -> block`
3. 定义 HITL SLA：
   - `confirm` 默认响应时限（示例：4h）
   - `escalate` 默认响应时限（示例：2h）
   - 超时策略（回退/阻断）和审计要求。
4. 对齐高风险场景白名单（依赖升级、DB migration、CI/发布、密钥/基础设施、大重构）。

验收标准（DoD）：

1. 风险评估输出可结构化落盘并可审计回放。
2. 每个高风险类型都能映射默认动作与超时行为。
3. 手工审批路径在日志中可追踪（触发、通知、结论、耗时）。

回滚策略：

1. 新契约异常时回退到“高风险默认 confirm + 人工最终裁决”。

### WP-05 拆解助手协议化（对应 O5）

目标：

1. 把“总纲 -> project/sprint/task”拆解流程模板化、半自动化。

实施项：

1. 定义拆解输入契约：`workstream/phase/goal/constraints/dependencies`.
2. 定义输出骨架：`plan.md + checklist + tasks.csv + TK-xxx` 草案。
3. 增加验收字段和验证字段默认模板。

验收标准（DoD）：

1. 任一新 workstream 可在统一模板下快速生成可执行任务骨架。
2. 输出结构与 AGENTS 命名规则、路径规则一致。

回滚策略：

1. 若模板不适配特殊任务，允许手工覆盖并记录偏差原因。

### WP-06 稳定化与度量（对应 O6/O7/O9/O10/O11）

目标：

1. 把流程优化从一次性动作变成持续改进机制。

实施项：

1. 周关键路径看板（O6）：展示阻塞点、等待时间、门禁失败 TopN。
2. 规则变更影响评估模板（O7）：变更前后影响范围、风险、回滚点。
3. Sprint 复盘模板（O9）：固定输入/输出，形成闭环。
4. 指标体系（O10）：效率、质量、风险三类指标统一口径。
5. 自动化编排看板 PoC（O11）：先做最小可用可视化，不直接替代现流程。

验收标准（DoD）：

1. 每个 sprint 至少产出一次可复用复盘结论。
2. 指标定义可用于对比“优化前后”的客观变化。

回滚策略：

1. 看板和指标收集影响交付时，优先保留关键指标，非关键项延后。

## 4. 任务包模板（用于后续 project/sprint/task 拆解）

| Task Pack ID | 对应工作包 | 目标交付件 | 预计工期 | 依赖 | 风险级别 |
|---|---|---|---|---|---|
| TP-001 | WP-01 | 门禁分层规范 + 命令矩阵 | 3-5 天 | 无 | 中 |
| TP-002 | WP-03 | CR 状态阈值模板 + 检查清单 | 2-3 天 | TP-001 | 低 |
| TP-003 | WP-02 | 台账单写源契约 + 同步机制设计 | 5-8 天 | TP-001 | 中高 |
| TP-004 | WP-04 | 风险判定契约 + HITL SLA | 4-6 天 | TP-001 | 高 |
| TP-005 | WP-05 | 拆解助手输入/输出协议模板 | 4-6 天 | TP-002/TP-003 | 中 |
| TP-006 | WP-06 | 看板/复盘/指标体系初版 | 5-8 天 | TP-003/TP-004/TP-005 | 中 |

每个 Task Pack 默认拆成以下任务类型：

1. `Design`：契约与边界定义。
2. `Implement`：脚本/模板/命令接入。
3. `Verify`：门禁验证与样例回放。
4. `Document`：规范文档与操作手册同步。

## 5. 门禁与验收机制（执行阶段）

### 5.1 门禁分层执行规则

1. 日常开发提交前：至少通过 `Fast Gate`。
2. 合并/发布前：必须通过 `Release Gate`。
3. 涉及高风险变更：除 `Release Gate` 外必须完成 HITL 审批记录。

### 5.2 建议命令分层

Fast Gate（建议最小集）：

```bash
pnpm run typecheck
pnpm run check
pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1
```

Release Gate（沿用标准全量链路）：

```bash
node ./scripts/governance/check-esm-import-specifiers.js
node ./scripts/governance/check-dynamic-import-usage.js
node ./scripts/governance/check-finite-literal-sets.js
node ./scripts/governance/check-utils-reuse-governance.js
node ./scripts/governance/check-type-governance.js
node ./scripts/governance/check-ts-only-residue.js
node ./scripts/governance/check-docs-triad-sync.js
node ./scripts/governance/check-jsdoc-governance.js
node ./scripts/governance/check-oop-structure.js
node ./scripts/governance/check-package-dependency-boundary.js --mode warn
node ./scripts/governance/check-task-ledger-sync.js
node ./scripts/governance/check-sprint-plan-status-sync.js
node ./scripts/governance/check-standardized-error-usage.js
node ./scripts/governance/check-artifact-registry-lifecycle.js
pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1
pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1
node ./dist/bin/repo-ai-governor.js --help >/dev/null
```

## 6. 风险管理与升级机制

### 6.1 风险分级（执行口径）

1. `L1 Low`：影响局部、可快速回滚。
2. `L2 Medium`：影响单模块或单流程，需要确认。
3. `L3 High`：影响多模块或关键治理链路，需要升级审批。
4. `L4 Critical`：影响发布安全/生产安全，默认阻断。

### 6.2 HITL 动作映射（执行口径）

1. `L1 -> allow`
2. `L2 -> confirm`
3. `L3 -> escalate`
4. `L4 -> block`

### 6.3 响应 SLA（建议初值）

1. `confirm`：4 小时内响应，超时默认 `block`。
2. `escalate`：2 小时内响应，超时默认 `block`。
3. `block`：仅在人工明确解除后可继续。

## 7. 变更管理与回滚总则

1. 每个工作包都必须声明回滚点（配置回滚、脚本回滚、流程回滚）。
2. 若任一工作包导致主流程阻塞超过 1 个工作日，触发回滚评审。
3. 回滚后必须在下一工作日补充根因记录与再进入条件。

## 8. 交付物清单（本计划执行完成时）

1. 《门禁分层规范》与命令矩阵。
2. 《CR 生命周期阈值规范》与模板。
3. 《任务台账单一写入源契约》与同步机制说明。
4. 《统一风险判定契约与 HITL SLA》文档。
5. 《拆解助手输入/输出协议》与样例。
6. 《周看板 + 复盘模板 + 指标定义》初版。

## 9. 启动检查清单（Kickoff Checklist）

1. 在 active stream 下创建本计划对应的 project/sprint/task 任务骨架。
2. 将 `TP-001` 到 `TP-006` 录入 `tasks/checklist.md` 与 `tasks/tasks.csv`。
3. 先执行 `TP-001` 与 `TP-002`，验证“低风险高收益”路径可用。
4. 通过一次完整 Release Gate，作为后续机制改造的对照基线。

## 10. 决策门（Go/No-Go）

进入 M2 前必须满足：

1. M1 交付件全部通过评审。
2. `Fast Gate` 与 `Release Gate` 边界已在团队内达成一致。
3. CR 阈值模板已在至少一个真实变更中试运行通过。

进入 M3 前必须满足：

1. 台账单写源和风险契约已完成一次端到端演练。
2. 关键脚本失败路径具备回滚预案并演练通过。

进入 M4 前必须满足：

1. 指标体系可稳定采集 2 个 sprint 周期。
2. 复盘结论证明机制优化对质量和效率有正向影响。
