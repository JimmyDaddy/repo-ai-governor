# Review: repo-ai-governor-master-execution-plan.md

- Status: verified
- Date: 2026-03-19
- Reviewer: AI Agent
- Target: `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. 审查范围

对执行计划的以下维度进行交叉审查：

1. 与 PRD 优先级和功能需求的对齐程度。
2. 与总技术方案阶段划分和契约定义的对齐程度。
3. 与架构蓝图迁移路径和模块依赖方向的对齐程度。
4. 可执行性（可直接拆解为 sprint/task 的友好度）。
5. 完整性（是否遗漏上游文档的关键交付项）。

## 2. 对齐良好的部分（通过项）

1. **三统一映射矩阵一致**：Stage 0-8 与 PRD `§10.1`、总纲 `§11.1`、架构蓝图 `§7.1` 的 `Priority-Phase-Migration` 矩阵完全对齐，无冲突。
2. **阶段 DoD 覆盖核心验收**：每个 Stage 的退出门禁可回溯到 PRD 成功指标（`§4.2`）和总纲质量总线（`§10`）。
3. **并行治理五条主线完备**：文档事实链路、质量门禁、安全权限、多语言、workspace 生命周期五条主线与 PRD `§8` 和总纲 `§10` 的要求一致。
4. **CR 生命周期映射正确**：`review_ → verified_ → resolved_` 与总纲 `§9.2` 和 PRD `§8.5` 的 CR 产物契约一致。
5. **Project 拆解与 Stage 边界清晰**：7 个 project 覆盖 8 个 Stage，未出现跨阶段硬并行。
6. **Task 模板包含 `depends_on_artifacts`**：与总纲 `§4.2.3` 的 Artifact Registry 契约以及 PRD `§8.10.2` 的依赖产物机制对齐。

## 3. 发现的问题

### 3.1 [严重] Standards Pack Policy Rule Compiler 与 Stage 3 策略门禁存在前置依赖缺口

- **位置**：Stage 3（策略与 HITL）与 Stage 4（规范与插槽体系）
- **现状**：执行计划将 Standards Pack 整体放在 Stage 4，排在 Stage 3（策略与 HITL）之后，对齐到 Phase B/C。
- **上游依据**：
  - 总纲 `§11` Phase B 定义为 "Policy Gate + HITL"，Phase C 为 "Adapter Hub + Artifact Registry Foundation"。
  - 架构蓝图 `§2` 的数据流中，`StandardsPack → PackRegistry → PolicyRuleCompiler → RiskEval`，说明 Standards Pack 的 Policy Rule Compiler 是 Change Risk Evaluator 的输入源。
- **影响**：Stage 3 的 Change Risk Evaluator 和 Policy Gate Engine 需要 Standards Pack 编译结果作为策略规则来源，但 Standards Pack 被推迟到 Stage 4。这会导致 Stage 3 无法使用由规范资产驱动的策略规则，只能硬编码策略或使用临时实现。
- **建议**：
  - 将 Standards Pack 的 `pack-registry` 和 `policy-rule-compiler` 基线前移至 Stage 3（或 Stage 2 末尾），使策略门禁可消费结构化规则。
  - Stage 4 保留 `rule-renderer`、`agents-projector`、Spec Sync Guard 和 Slot Engine。

### 3.2 [严重] Memory 基础设施在执行计划中缺失独立交付节点

- **位置**：Stage 0-2
- **现状**：Stage 0-2 没有显式提及 `core-memory`、`core-session`、`memory-store-adapter`、`memory-providers/fs-csv` 的交付。
- **上游依据**：
  - 总纲 `§4.3` 定义了永久记忆/执行记忆/共享 session 模型。
  - 架构蓝图 `§7` Step 2 明确要求抽离 `core-memory/core-session/memory-store-adapter`，Step 3 要求落地 `memory-providers/fs-csv`。
  - 架构蓝图 `§2` 时序图显示，Runtime 每个 stage 都通过 `Memory Manager → Store Adapter → Provider` 链路读写。
- **影响**：Stage 2 的 Runtime 执行依赖 Memory/Session 基础设施，但执行计划未明确其交付窗口，可能导致实施时被遗漏或临时替代。
- **建议**：
  - 在 Stage 1 或 Stage 2 中增加显式任务：交付 `core-memory`、`core-session`、`memory-store-adapter` 契约与 `memory-providers/fs-csv` 基线实现。

### 3.3 [中等] 升级与迁移 UX 基线未在执行计划中体现

- **位置**：Stage 1 及后续各 Stage
- **现状**：Stage 1 提到了 workspace 迁移链路和配置 schema 校验，但未覆盖 PRD `§8.10.1` 的完整升级 UX 基线。
- **上游依据**：PRD `§8.10.1` 要求：
  - Schema 迁移流程（schema diff → 自动迁移建议 → 人工确认）
  - 冲突处理流程（本地定制 vs 新规范包冲突清单）
  - 回滚流程（升级失败一键回滚）
  - 版本固定策略（pin 主版本，minor/patch 自动跟随或手动）
- **影响**：`upgrade` 命令在 Stage 1 仅列为 CLI 骨架交付，但升级的核心 UX 链路（冲突处理、回滚、版本 pin）未在任何 Stage 明确安排。
- **建议**：
  - 在 Stage 4（Standards Pack 交付后）或 Stage 6 补充一个升级 UX 闭环任务，覆盖 schema 迁移、冲突处置、回滚与版本固定。

### 3.4 [中等] 数据隐私与审计保留策略未覆盖

- **位置**：Stage 6（审计、回放与依赖产物运行时）
- **现状**：Stage 6 交付 Audit Recorder，但执行计划未提及 PRD `§13.1` 的数据隐私要求。
- **上游依据**：PRD `§13.1` 要求：
  - 审计日志默认保留 90 天（可配置）
  - 敏感信息写入前脱敏
  - 支持按条件导出与删除
  - 企业场景可覆盖保留策略
- **影响**：如果 Audit Recorder 基线实现时不考虑脱敏和保留机制，后续补齐成本较高且可能需要数据迁移。
- **建议**：
  - 在 Stage 6 Audit Recorder 任务中明确包含：脱敏管道、保留周期配置、导出/删除接口。

### 3.5 [中等] 受限网络模式（Restricted Network Mode）未在执行计划中体现

- **位置**：全计划范围
- **现状**：所有 Stage 均未提及离线/受限网络场景。
- **上游依据**：PRD `§8.7` 需求 9-10 要求：
  - 无法访问外部模型时，仍可执行本地规则检查、流程编排与台账回写。
  - 支持本地模型适配路径（如 Ollama）。
- **影响**：如果适配器层没有考虑受限网络降级，用户在离线环境将面临完全不可用。
- **建议**：
  - 在 Stage 5（适配器交付）或 Stage 7（强化）中增加受限网络模式交付项，至少覆盖：无外部模型时本地门禁可运行、adapter 连接失败的降级策略。

### 3.6 [中等] Slot 脚本安全执行模型的落地描述不够具体

- **位置**：Stage 4 第 4 点
- **现状**：写的是"落地脚本插槽安全模型（权限白名单、资源配额、I/O 契约、失败隔离、审计字段）"，仅括号内列举。
- **上游依据**：
  - 总纲 `§8.5` 定义了完整的 Script Slot Security Model（6 个维度：沙箱默认执行、权限白名单、资源限制、I/O 契约、隔离与失败处理、审计字段）。
  - PRD `§8.4` 第 7 条对安全基线有 4 项子要求。
- **影响**：括号列举容易在任务拆解时丢失细项，尤其是"受限沙箱默认执行"和"策略引擎审批权限申请"两个关键环节。
- **建议**：
  - 将 Stage 4 第 4 点展开为子任务清单，至少包含：沙箱执行环境、声明式权限审批链路、资源限制配置、I/O 契约校验、失败隔离机制、审计字段接入。

### 3.7 [轻微] `config` 包在执行计划中缺乏显式交付

- **位置**：Stage 1
- **现状**：Stage 1 提到"配置模型与 schema 校验"，但架构蓝图中 `config` 是一个独立 package（`packages/config/`），执行计划未明确其包级交付。
- **上游依据**：
  - 架构蓝图 `§5` 目录结构中有独立的 `packages/config/`。
  - 架构蓝图 `§6` 依赖约束中，多个核心包依赖 `config`。
  - 总纲 `§4.1` 将 Config & Schema Layer 列为独立分层。
- **建议**：
  - 在 Stage 1 中明确 `packages/config` 作为独立交付项，包含 Config Loader、Schema Validator、Profile Resolver 的基线实现。

### 3.8 [轻微] `integrations/` 目录（CI/IDE 集成）在执行计划中未出现

- **位置**：全计划范围
- **现状**：架构蓝图 `§5` 目标结构中有 `integrations/ci/` 和 `integrations/ide/`，但执行计划没有将其纳入任何 Stage。
- **上游依据**：
  - PRD `§8.1` 要求基础 CI 集成能力（P0）。
  - 架构蓝图 `§5` 将 `integrations/` 列为顶层目录。
- **影响**：CI 集成可能散落在各 Stage 中而没有统一治理入口。
- **建议**：
  - 在 Stage 0 或 Stage 1 中明确 `integrations/ci/` 骨架交付。IDE 集成可推迟到 Stage 5 后。

### 3.9 [轻微] 依赖边界检查脚本的交付节点缺少具体路径引用

- **位置**：Stage 0 第 2 点
- **现状**：Stage 0 第 2 点提到"落地依赖方向检查脚本与 CI 接线"，但未指向架构蓝图 `§6.1` 中规划的具体脚本路径。
- **上游依据**：架构蓝图 `§6.1` 明确脚本路径为 `scripts/governance/check-package-dependency-boundary.js`，并描述了 warning → blocking 的渐进策略。
- **建议**：
  - 在 Stage 0 第 2 点中明确引用 `scripts/governance/check-package-dependency-boundary.js`，并补充渐进生效策略（初期 warning + 白名单，稳定后 blocking）。

### 3.10 [轻微] 完成态定义（§8）缺少部分 PRD 成功指标

- **位置**：§8 完成态定义
- **现状**：§8 完成态定义列了 5 条，但 PRD `§4.2` 的成功指标有 5 条，其中第 2 条"AI 生成代码的规范违规率明显下降"和第 4 条"团队可通过统一配置在多个仓库中复用规范"在完成态定义中未体现。
- **建议**：
  - 在 §8 中补充：规范违规率可度量（至少有 check 输出违规统计）；团队级共享规范包可跨仓库复用。

## 4. 审查总结

| 维度 | 评价 | 说明 |
|---|---|---|
| 与 PRD 优先级对齐 | ★★★★☆ | 主干对齐，升级 UX / 隐私 / 离线模式有遗漏 |
| 与总技术方案对齐 | ★★★★☆ | 阶段/契约覆盖好，Memory 基础设施和策略规则来源有缺口 |
| 与架构蓝图对齐 | ★★★★☆ | 迁移 Step 映射准确，`config` 包 / `integrations/` 目录 / 依赖检查脚本细节缺失 |
| 可执行性 | ★★★★☆ | 大部分可直接拆 sprint，Slot 安全模型和升级 UX 需展开 |
| 完整性 | ★★★☆☆ | 主干完整，10 个细项缺口需补齐 |

## 5. 结论与建议

执行计划主干骨架与三份上游文档高度一致，阶段划分和映射矩阵逻辑正确。主要问题集中在三个方面：

1. **依赖前置关系**：Standards Pack 的 `policy-rule-compiler` 是 Policy Gate 的输入源，需将基线前移至 Stage 3。
2. **Memory 基础设施缺乏显式交付节点**：Runtime 依赖 Memory/Session 链路，需在 Stage 1-2 补充。
3. **PRD 非功能需求遗漏**：升级 UX 闭环、数据隐私/脱敏、受限网络模式需在对应 Stage 补充交付项。

建议按上述 10 个问题逐项修补后再进入 sprint 拆解，优先处理 §3.1 和 §3.2 两个严重问题。

## 6. 复核结果（verify append）

- Verify Date: 2026-03-19
- Verifier: AI Agent
- Verify Target: `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
- Verify Summary: 本次 review 提出的 10 个问题已完成对应修补，执行计划可进入下一步 sprint/task 拆解。

### 6.1 逐项复核状态

1. §3.1 [严重] Standards Pack Policy Rule Compiler 前置依赖缺口：**已修复**
   - 已将 `pack registry + policy rule compiler` 前移到 Stage 3，作为 Risk/Policy 规则输入。
2. §3.2 [严重] Memory 基础设施缺失独立交付节点：**已修复**
   - Stage 2 已显式补充 `core-memory`、`core-session`、`memory-store-adapter` 与 `memory-providers/fs-csv`。
3. §3.3 [中等] 升级与迁移 UX 基线未体现：**已修复**
   - Stage 1 增加升级骨架；Stage 4 补齐冲突清单、回滚与版本 pin 策略。
4. §3.4 [中等] 数据隐私与审计保留策略未覆盖：**已修复**
   - Stage 6 增加默认 90 天保留、脱敏、导出/删除能力。
5. §3.5 [中等] 受限网络模式未体现：**已修复**
   - Stage 5 增加 Restricted Network Mode；Stage 7 增加相关稳定性回归。
6. §3.6 [中等] Slot 脚本安全模型描述不够具体：**已修复**
   - Stage 4 已细化为六项安全落地点（沙箱、审批、资源、I/O、隔离、审计）。
7. §3.7 [轻微] `config` 包缺乏显式交付：**已修复**
   - Stage 1 已新增 `packages/config` 基线交付。
8. §3.8 [轻微] `integrations/` 目录未出现：**已修复**
   - Stage 0 增加 `integrations/ci/`，Stage 5 增加 `integrations/ide/`。
9. §3.9 [轻微] 依赖边界检查脚本缺少具体路径引用：**已修复**
   - Stage 0 已明确 `scripts/governance/check-package-dependency-boundary.js` 与 warning->block 渐进策略。
10. §3.10 [轻微] 完成态定义缺少部分 PRD 成功指标：**已修复**
   - 完成态新增“规范违规率可度量下降”与“共享规范包跨仓库复用可追溯”。

### 6.2 复核结论

本次 review 发现项均已在目标执行计划中落地。建议将本 CR 文档状态从 `review_` 迁移为 `verified_review_`，进入后续执行拆解阶段。
