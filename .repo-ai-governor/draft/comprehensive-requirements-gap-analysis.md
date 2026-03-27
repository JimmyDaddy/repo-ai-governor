# Repo AI Governor 需求-实现综合差距分析

- Status: draft
- Date: 2026-03-27
- Scope: PRD v0.3 全量能力域 vs 当前代码库实现 + 技术方案 + 执行计划
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`
  - `.repo-ai-governor/draft/prd-completion-status-analysis.md`
  - `.repo-ai-governor/draft/implementation-gap-analysis.md`
  - `README.md`、`package.json`、`packages/*`、`integrations/*`、`examples/*`

---

## 1. 总体结论

当前项目已经从 Stage 0 推进到 Stage 9 投产收口 + Post-Stage-9 runtime modernization 阶段，25 个 project 中 24 个已完成（`project-025` 活跃中）。核心架构、编排引擎、策略门禁、审计回放、Artifact Registry、多工具适配、LangGraph runtime 等主干能力均已实质性落地。

**但当前实现与 PRD 全量目标之间仍存在三类结构性差距：**

1. **P0/P1 产品化"最后一公里"**：核心能力已有，但面向外部 adopter 的打包分发、升级迁移、稳定支持矩阵等产品化体验仍有缺口
2. **P1 部分能力域深度不足**：i18n 覆盖度、多编程语言治理模板、团队共享规范包分发、通知渠道实际 provider 实装等
3. **P2 平台化能力尚远**：桌面端、可视化面板、云端同步、插槽市场等 P2 能力仍停留在架构预留和 contract 层

### 完成度估计

| 维度 | 完成度 | 判断依据 |
|---|---|---|
| P0（MVP 必须具备） | ~90% | `project-020` 已完成打包真值修复和 adopter pilot，但 tgz 仍依赖 registry 访问 |
| P1（增强能力，进行中） | ~75% | 编排/HITL/适配/审计主干完成，升级 UX、语言模板、通知 provider 仍偏弱 |
| P2（平台化能力，规划中） | ~10-15% | 仅有架构预留和骨架，桌面/云/可视化均无实装 |
| 架构能力完成度 | ~85% | 所有核心引擎组件已实质性实装 |
| 外部产品化完成度 | ~65-70% | `project-020` 已改善，但仍有产品化收口空间 |

---

## 2. PRD 核心能力域逐项对照

### 2.1 分发与安装（PRD §8.1）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| npm 全局安装、devDependency 安装、npx/pnpm dlx 执行 | ✅ `path`/`link`/`tgz`/`dist` 四种安装模式已落地 | tgz 仍需 npm registry 访问，不是完全离线自包含 |
| 初始化命令（`init`） | ✅ 已有真实语义 | — |
| 诊断命令（`doctor`） | ✅ 已有 attach mode 检测 | — |
| 检查命令（`check`） | ✅ 已有治理检查聚合 | — |
| 执行命令（`run`） | ✅ 已升级为任务驱动 DAG | — |
| 评审命令（`review`/`review-verify`） | ✅ 含 ledger backfill | — |
| 升级命令（`upgrade`） | ⚠️ 命令已有，但 UX 偏工程化 | 用户级冲突处理路径和回滚体验不够清晰 |

**差距小结**：命令面完整，但 `tgz` 离线安装和 `upgrade` 用户体验仍有收口空间。

---

### 2.2 仓库治理激活与 Workspace 生命周期（PRD §8.2）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 识别仓库是否已启用治理 | ✅ `doctor` 可检测 | — |
| 初始化时生成治理配置 | ✅ `governor.yaml`、workspace 解析 | — |
| 只读接入模式 | ✅ `doctor` 返回 `read_only` 语义 | — |
| `tool_managed`/`repo_local` 双模式 | ✅ 双模式已实装 | — |
| 默认 `tool_managed` | ✅ 已实装 | — |
| `copy/verify/switch` 三阶段迁移 + rollback | ⚠️ `WorkspaceMigrationService` 已有 | rollback 路径和原子性尚需更完整的集成测试验证 |
| workspace dry-run/execute/rollback CLI | ✅ 已有 workspace 子命令 | — |

**差距小结**：主干已完整。迁移 rollback 路径的健壮性和外部仓库的 workspace 切换体验可进一步加强。

---

### 2.3 标准规范能力（PRD §8.3）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 内置标准规范包（代码/工程/流程/质量/协作） | ✅ `packages/standards` 含 pack registry、renderer、projector | — |
| 规范版本化 | ✅ pack registry 含 version 字段 | — |
| 区分"强约束"和"建议项" | ✅ policy-rule-compiler 可编译强约束 | — |
| human/ai/agents 三视图渲染 | ⚠️ 三类渲染器均已实装 | **端到端链路是否形成真实闭环未经充分验证** |
| `AGENTS.md` 由 canonical source 投影 | ⚠️ `agents-projector` 已存在 | 当前 `AGENTS.md` 是否由 projector 自动渲染尚不完全确定 |
| pack registry / rule renderer / agents projector 职责分离 | ✅ 已实装 | — |
| 官方/团队/仓库三层规范合并优先级 | ✅ 配置支持 `merge_precedence` | 团队共享包外部分发消费体验未完全产品化 |

**差距小结**：标准规范能力是当前项目最成熟的部分之一。主要差距在于团队共享规范包的**外部分发和消费路径**，以及三视图渲染管道的**端到端验证**。

---

### 2.4 规范插槽机制（PRD §8.4）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 声明式插槽定义 | ✅ `packages/slots` 已实装 | — |
| 脚本扩展（双轨制） | ✅ 含安全模型 | — |
| 权限白名单、资源配额、副作用声明 | ✅ slot-engine 含安全评估 | — |
| 插槽冲突处理 | ✅ 冲突解析已实装 | — |
| 插槽调试与测试 | ⚠️ 基础存在 | 面向开发者的插槽调试工具链不够丰富 |

**差距小结**：插槽机制 v1 已完整。后续可在插槽调试/测试 DX 上进一步提升。

---

### 2.5 流程编排引擎（PRD §8.5）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 标准阶段化流程（需求→方案→拆解→开发→自测→CR→复核→回写） | ✅ 全流程已打通 | — |
| Sequential/Parallel/Loop/Condition 节点 | ✅ 全部落地 | — |
| Loop 必须声明 `maxCycles` + `maxWallTimeSeconds` | ✅ LangGraph backend 已强制 | — |
| 流程模板化 | ✅ 已支持 | — |
| 跳步限制 | ✅ 策略门禁保障 | — |
| 多 Agent 角色编排（Planner/Architect/Coder/Tester/Reviewer/Verifier） | ✅ Role Registry + 6 个默认角色 | — |
| 确定性编排 + 智能执行双层模型 | ✅ DSL/IR 编排 + Agent 执行 | — |
| graph-first orchestration backend | ✅ LangGraph backend 已由 project-014/016 完成 | — |
| CLI/desktop 共用 local orchestration service | ⚠️ `core-orchestration-service` 已实装 | Desktop 消费端尚无实装（见 §2.10） |
| 任务拆解产物（方案/checklist/CSV/review 目录） | ✅ 全套产物路径已定义并使用 | — |

**差距小结**：编排引擎是项目最核心的已完成能力。LangGraph runtime modernization 已完成第一阶段。Desktop 消费端是主要未实装项。

---

### 2.6 多 Agent 协议与运行时（PRD §8.5.1）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 统一 Agent 协议 | ✅ `adapter-sdk/agent-protocol.abstract.ts` | — |
| Agent 注册与发现 | ✅ Role Registry + route-runner | — |
| 会话级状态共享 | ✅ `shared-session-manager.ts` | — |
| 暂停/恢复与人工接管 | ✅ HITL runtime + resume/terminate/degrade | — |
| 混用不同 AI 工具实现 | ✅ adapter 层支持多工具并存 | — |

**差距小结**：多 Agent 协议与运行时已基本完整。

---

### 2.7 AI 全自动开发模式（PRD §8.6）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 自动/人工协作模式切换 | ✅ 已支持 | — |
| 分级授权（只读→编辑→运行→提交→PR） | ✅ 权限模型已实装 | — |
| 策略化人工闸口（HITL with Policy） | ✅ 方案评审/复核升级/有权限 CR | — |
| Change Risk Evaluator 统一风险判定 | ✅ `core-change-risk` 已实装 | — |
| 审计记录（AI 做了什么/为什么/哪些规范命中） | ✅ audit-recorder + 审计事件结构 | — |
| 默认自动化权限边界 | ✅ 配置驱动 | — |
| **通知渠道实际 Provider** | ❌ **策略路由层完备，但无 email/webhook/chat-im 真实实装** | **HITL 通知在生产场景下无法送达外部渠道** |

**差距小结**：自动模式主干完整。**最关键的缺口是通知渠道 Provider 的实际实装缺失**，直接影响 HITL 通知的真实可用性和 GA Readiness §10.2 #8 的满足。

---

### 2.8 模型与工具适配（PRD §8.7）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 统一适配层 | ✅ Adapter SDK + route-runner | — |
| Codex/GitHub Copilot/Claude Code 适配器 | ✅ 三个 adapter 包已有真实调用 | — |
| 本地模型适配路径（Ollama） | ✅ `adapters/local-model` 已存在 | — |
| 能力矩阵声明与降级 | ✅ 已实装 | — |
| 适配器开发接口（社区扩展） | ✅ Adapter SDK 可扩展 | — |
| 网络受限模式 | ✅ restricted network mode 基线已有 | — |

**差距小结**：多工具适配能力已基本完整。后续拓展更多 IDE surface 属于增量工作。

---

### 2.9 多语言支持（PRD §8.8）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 中文/英文双语输出 | ⚠️ `packages/shared/src/i18n/` i18next 基线已有 | zh-CN/en 语义键覆盖度未经全面核查 |
| 多编程语言治理模板（TS/Python/Go/Java/Rust） | ⚠️ TypeScript 最成熟 | **Python/Go/Java/Rust 等语言治理模板的正式产品化证据不足** |
| 按语言/框架加载不同规范包与检查链路 | ⚠️ 架构支持 | 非 TypeScript 语言的规范包和检查链路尚未丰富 |
| 规则 AI 视图 + 人类文档视图 | ✅ 同源双视图 | — |

**差距小结**：i18n runtime 基础已建立，但**多编程语言治理模板和 i18n 键集覆盖度**是明确的 P1 缺口。

---

### 2.10 可观测性与报告（PRD §8.9）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 流程报告输出 | ✅ `packages/reporting` | — |
| 规范命中/违规报告 | ✅ 已实装 | — |
| 失败原因与修复建议 | ✅ 已实装 | — |
| 写入本地/终端摘要/CI 日志 | ✅ 已实装 | — |
| 依赖产物注册与追踪 | ✅ Artifact Registry | — |
| CLI pretty/plain/json 三模式 | ✅ 已实装 + TTY 自动降级 | — |
| **组织级审计看板** | ❌ 未实装 | P2 范畴 |
| **可视化配置与执行面板** | ❌ 未实装 | P2 范畴 |

**差距小结**：本地可观测性已完整。组织级看板和可视化面板属于 P2，当前未进入实装。

---

### 2.11 配置与版本治理（PRD §8.10）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| 分层覆盖（官方/团队/仓库/运行参数） | ✅ 配置加载支持 | — |
| 配置校验和迁移 | ✅ `UpgradeSchemaDiffService` | — |
| 规范包版本锁定与升级策略 | ✅ `StandardsUpgradePlanner` | — |
| Schema 迁移流程（diff→建议→确认→回滚） | ⚠️ 服务层能力存在 | 面向 adopter 的完整 UX 流程仍偏工程化 |
| Artifact Registry 生命周期 | ✅ active/frozen/deprecated/archived/retired 全套 | — |
| 三层文档同步门禁 | ✅ governance scripts 覆盖 | — |

**差距小结**：基础完整。升级迁移的 adopter UX 可继续完善。

---

### 2.12 桌面端与 P2 平台化（PRD §10 P2）

| PRD 要求 | 实现状态 | 差距 |
|---|---|---|
| **插槽市场/共享机制** | ❌ 未实装 | P2 |
| **可视化配置与执行面板** | ❌ 未实装 | P2 |
| **组织级审计与指标看板** | ❌ 未实装 | P2 |
| **云端同步与策略分发** | ❌ 未实装 | P2 |
| **Desktop Client** | ❌ `integrations/desktop/` 仅 README + sample | sidecar + IPC 基础设施已完备，但消费 UI 层缺失 |

**差距小结**：P2 平台化能力整体尚远。Desktop Client 是 P1/P2 交界处的关键缺口。

---

## 3. GA Readiness 量化信号对照（PRD §10.2）

| 条目 | 要求 | 当前状态 | 差距 |
|---|---|---|---|
| #1 | ≥2 个试点仓库完成接入，≤15 min | ⚠️ `project-020` 已做双仓库 adopter pilot | 需确认试点记录是否达标 |
| #2 | clean-room 两种安装模式各连续 3 次通过 | ⚠️ 有 clean-room 验证脚本 | 连续 3 次记录完整性待确认 |
| #3 | 黑盒路径矩阵 100% 通过 | ⚠️ blackbox E2E 测试存在 | 需连续通过记录 |
| #4 | ≥1 条无人值守链路连续 3 次 rehearsal 通过 | ⚠️ rehearsal 脚本已有 | 连续记录待确认 |
| #5 | 试点期失败事件全部结构化归因 | ⚠️ 审计结构已有 | 试点数据归因待确认 |
| #6 | workspace 切换 clean-room 路径通过 | ⚠️ 已有切换能力 | 完整 clean-room 记录待确认 |
| #7 | ≥1 组外部消费契约黑盒矩阵通过 | ⚠️ 有契约测试 | 正式矩阵记录待确认 |
| #8 | **≥1 主 1 备 HITL 通知渠道 rehearsal 通过** | ❌ **通知 provider 未实装** | **GA 硬阻断** |
| #9 | ≥1 条受控 delivery rehearsal 通过 | ⚠️ delivery-rehearsal-runtime 存在 | 证据文档待确认 |
| #10 | 已声明最小支持矩阵 + clean-room smoke 记录 | ⚠️ README 有支持说明 | 正式支持矩阵文档可强化 |
| #11 | 运营指标快照 | ⚠️ 指标框架已有 | 正式指标快照待沉淀 |

---

## 4. 差距汇总与优先级矩阵

### 4.1 硬阻断项（GA Blocker）

| Gap ID | 描述 | PRD 依据 | 严重程度 | 状态 |
|---|---|---|---|---|
| **GAP-NP** | 通知渠道 Provider 实装缺失（email/webhook/chat-im） | §8.6 #5, §10.2 #8 | **P0 阻断** | `notification-providers/` 目录不存在 |

### 4.2 P1 未完成缺口

| Gap ID | 描述 | PRD 依据 | 说明 |
|---|---|---|---|
| GAP-LANG | 多编程语言治理模板产品化不足 | §8.8 #1 | Python/Go/Java/Rust 规范包缺正式产品化 |
| GAP-I18N | i18n 键集覆盖度和 CLI 文案本地化不完整 | §8.8 #3, §8.9.1 #6 | zh-CN/en 语义键覆盖度待核查 |
| GAP-SHARE | 团队共享规范包外部分发和消费体验未完整产品化 | §8.3 #9 | 三层来源（官方/团队/仓库）的消费路径未清晰 |
| GAP-UPG | upgrade/workspace lifecycle 采用者 UX 偏工程化 | §8.10.1 | 冲突处理、回滚、dry-run 体验可进一步提升 |
| GAP-3VIEW | Standards Pack 三视图渲染端到端链路未充分验证 | §8.3 #7-8 | pack→renderer→projector→AGENTS.md 投影闭环待 E2E 验证 |
| GAP-EXPORT | package.json `exports` 声明系统性核查 | 架构 §6.2 | 6 个 public 包的 exports 完整性待逐包确认 |
| GAP-SLOT-DX | 插槽调试与测试工具链 | §8.4 #5 | 面向开发者的插槽调试 DX 可加强 |
| GAP-MATRIX | 正式支持矩阵文档和承诺 | §10.2 #10 | 哪些是正式支持的安装模式/适配器/IDE |

### 4.3 P2 远期缺口

| Gap ID | 描述 | PRD 依据 | 说明 |
|---|---|---|---|
| GAP-DESKTOP | Desktop Client 实装缺失 | §8.5 #10, §10 P2 | 仅 README + sample，无 TS 实装 |
| GAP-VISUAL | 可视化配置与执行面板 | §10 P2 | 未实装 |
| GAP-CLOUD | 云端同步与策略分发 | §10 P2 | 未实装 |
| GAP-MARKET | 插槽市场/共享机制 | §10 P2 | 未实装 |
| GAP-ORG | 组织级审计与指标看板 | §10 P2 | 未实装 |

---

## 5. 与已有差距分析对比：project-020 之后的变化

project-019 ~ project-024 的完成使得部分差距已收窄或关闭：

| 原有差距 | 承接项目 | 当前状态 |
|---|---|---|
| 打包分发真值未闭环 | project-020 | ✅ 已基本关闭。tgz clean-room 已支持（需 registry），`path`/`link`/`dist` 路径全通 |
| 外部 adopter 产品化体验弱 | project-020 sprint-004 | ✅ 已完成双仓库 adopter pilot 和文档真值闭环 |
| workspace migration 原子性 | project-023 | ✅ 已完成 artifact locality、rollback scratch cleanup |
| memory provider pluginization | project-015 | ✅ 已完成（execution plan 确认 completed） |
| LangGraph runtime productization | project-016 | ✅ 已完成 |
| memory semantics safety | project-022 | ✅ 已完成 |
| gate execution efficiency | project-024/025 | ⚠️ 技术方案已正式化，实现主线进行中 |

---

## 6. 推荐执行优先序

### 第一优先级：关闭 GA 硬阻断

1. **GAP-NP**：实装至少 1 个通知渠道 Provider（建议 webhook 为主、email 为备），接入 `notification-dispatcher`，完成 1 主 1 备 HITL rehearsal

### 第二优先级：P1 产品化收口

2. **GAP-LANG**：补齐至少 Python 或 Go 的最小治理模板示例
3. **GAP-I18N**：核查 zh-CN/en 键集完整性，补缺失翻译键
4. **GAP-SHARE**：明确团队共享规范包的分发和消费路径文档
5. **GAP-3VIEW**：补写 Standards Pack 端到端投影链路 E2E 测试
6. **GAP-UPG**：继续打磨 upgrade/workspace lifecycle 的 adopter UX

### 第三优先级：GA 运营证据

7. 沉淀 GA Readiness §10.2 各项正式量化证据（连续 rehearsal 记录、正式支持矩阵、运营指标快照）

### 第四优先级：P2 平台化（暂缓）

8. Desktop Client、可视化面板、云端同步等 P2 能力需在 P0/P1 完全收口后再推进

---

## 7. 结构性风险提示

> [!WARNING]
> **内部治理成熟度高于外部产品化成熟度**仍是当前最核心的结构性偏差（详见 `repo-ai-governor-current-state-vs-prd-gap-assessment.md` §3.2）。
>
> 虽然 project-020 已显著改善了外部采用面，但如果后续继续优先投入内部治理机制深化（如 triad/module/lifecycle 进一步复杂化），而非外部 adopter 的通知渠道、多语言模板、团队共享包等产品化缺口，这个偏差会继续放大。
>
> 建议原则：**P0/P1 外部产品化缺口关闭前，P2 和内部治理深化均暂缓。**

---

## 8. 参考依据

- [PRD §8 核心能力需求](../normative_knowledge_sources/product-requirements.md)
- [PRD §10 功能优先级](../normative_knowledge_sources/product-requirements.md)
- [PRD §10.2 GA Readiness 量化信号](../normative_knowledge_sources/product-requirements.md)
- [技术方案 §4 总体架构](../normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md)
- [执行计划 §3 当前执行摘要](../normative_knowledge_sources/repo-ai-governor-master-execution-plan.md)
- [架构蓝图 §6 分层约束](../normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md)
- [既有差距评估 draft](repo-ai-governor-current-state-vs-prd-gap-assessment.md)
- [既有完成状态分析 draft](prd-completion-status-analysis.md)
- [既有实现差距分析 draft](implementation-gap-analysis.md)
