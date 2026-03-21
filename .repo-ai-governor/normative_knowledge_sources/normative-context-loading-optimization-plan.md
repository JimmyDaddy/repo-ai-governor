# Normative Context Loading Optimization Plan

- Status: draft-for-review
- Date: 2026-03-21
- Scope: `.repo-ai-governor/normative_knowledge_sources/**`
- Goal: 降低默认上下文长度，同时保持执行正确性与治理稳定性

## 1. 背景与问题

当前 `normative_knowledge_sources` 资产逐步增长，若执行前按“全量读取”方式加载，会出现：

1. 上下文 token 成本持续上升。
2. 非当前任务文档噪声增加，影响决策聚焦。
3. 新旧规范混读，增加执行偏移风险。

## 2. 优化目标（可量化）

1. 默认加载上下文体积降低 40%-60%。
2. triad 文档与治理规则的错误引用率不高于当前基线。
3. 执行效率提升：规划类任务响应时间与文档定位时间可观测下降。

## 3. 总体方案：分层 + 清单驱动 + 按需展开

### 3.1 知识分层模型

1. `L0 Required`（默认必读）
   - `product-requirements-brief.md`
   - `governance/code_standards.md`
   - `context/current-context.md`（位于 context 目录，但作为执行必读输入）
2. `L1 Operational`（按任务类型读取）
   - `repo-ai-governor-overall-technical-solution.md`
   - `repo-ai-governor-architecture-and-repo-layering.md`
   - `repo-ai-governor-master-execution-plan.md`
3. `L2 Reference`（检索式读取）
   - 各类历史评审、优化建议、专题说明。
4. `L3 Archive`（默认不读）
   - 已归档/过期/被替代文档，仅在追溯时读取。

### 3.2 清单驱动（Manifest）

为所有规范文档建立统一清单（建议文件：`.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`），每条文档至少声明：

1. `doc_id`
2. `path`
3. `tier`（L0/L1/L2/L3）
4. `status`（active/frozen/deprecated/archived）
5. `default_load`（true/false）
6. `load_trigger`（任务触发条件）
7. `owner`
8. `last_reviewed_at`

## 4. 默认加载策略

### 4.1 Baseline（所有任务）

1. 仅加载 `L0`。
2. 若 `L0` 冲突，按 `code_standards` 与 `product-requirements-brief` 先行对齐。

### 4.2 Task-triggered Loading

1. 架构/分层/模块边界变更 -> 加载 `L1` 中 architecture/solution。
2. 迭代拆解/里程碑规划 -> 加载 master execution plan。
3. 仅执行单任务修订 -> 默认不加载 `L2/L3`。

### 4.3 Fallback

1. 若执行中发现信息不足，按 `L1 -> L2` 顺序逐级补载。
2. 禁止直接跳到 L3，除非明确追溯历史决策。

## 5. 文档结构优化建议（最小侵入）

### 5.1 为大文档增加轻量摘要层

建议新增（或维护）以下摘要文档用于默认加载：

1. `product-requirements-brief.md`（已存在，继续作为 PRD 默认入口）
2. `overall-technical-solution-brief.md`（新增）
3. `architecture-and-repo-layering-brief.md`（新增）

要求：

1. 摘要文档只保留执行必要约束与链接，不复制长篇正文。
2. 正文继续作为 L1/L2 按需展开。

### 5.2 Archive 分区

在 `normative_knowledge_sources` 下增加：

1. `archive/`（归档规范）
2. `superseded/`（被替代但短期保留）

约束：

1. `archive/superseded` 文档默认 `L3` + `default_load=false`。
2. active 文档不得放入归档分区。

## 6. 门禁与治理

建议新增一个轻量治理脚本（后续任务实现）：

1. `scripts/governance/check-normative-loading-manifest.js`

校验项：

1. `normative_knowledge_sources` 下 active 文档必须出现在 manifest 中。
2. manifest 中 `default_load=true` 的文档必须属于 `L0/L1`。
3. `archived` 文档不得配置为 `default_load=true`。
4. triad 文档状态必须一致且为 active/frozen。

## 7. 迁移计划（建议两周）

### Phase A（Day 1-2）：盘点与标注

1. 盘点所有 normative 文档。
2. 为每个文档打 tier 与 status 草案。
3. 确认默认加载集（初版 L0/L1）。

### Phase B（Day 3-5）：清单与摘要

1. 落盘 `normative-loading-manifest.yaml`。
2. 新增 solution/architecture 两份 brief。
3. 建立 summary -> full doc 的跳转关系。

### Phase C（Day 6-8）：接入门禁

1. 实现并接入 `check-normative-loading-manifest.js`。
2. 将其加入治理命令链路（先 warn 后 block）。

### Phase D（Day 9-10）：试运行与校准

1. 选择 1 个 sprint 试跑分层加载。
2. 采集 token/耗时/偏移数据。
3. 调整 tier 与 trigger 规则。

## 8. 验收标准

1. 默认加载文件清单可由 manifest 单点生成。
2. `L0` 文档集合稳定，且覆盖执行必需规则。
3. 门禁可检测“未登记 active 文档”和“错误 default_load 配置”。
4. 试运行 sprint 中未发生因信息缺失导致的重大执行偏移。

## 9. 风险与缓解

1. 风险：摘要与正文语义漂移。
   - 缓解：在门禁中增加摘要回链检查（必须标注来源章节）。
2. 风险：过度裁剪导致执行信息不足。
   - 缓解：保留 `L1` 逐级补载机制，不直接阻断。
3. 风险：清单维护负担上升。
   - 缓解：用脚本自动发现未登记文档，减少人工巡检。

## 10. 直接可拆任务（供 project/sprint/task 使用）

1. `TK-A`: 建立 normative loading manifest 初版并回填全量文档元数据。
2. `TK-B`: 新增 solution/architecture brief，并建立与全文双向链接。
3. `TK-C`: 新增 manifest 校验脚本并以 warn 模式接入。
4. `TK-D`: 执行 1 个 sprint 试运行并产出上下文成本对比报告。
5. `TK-E`: 将 manifest 校验脚本升级为 blocking，并归档过期文档。
