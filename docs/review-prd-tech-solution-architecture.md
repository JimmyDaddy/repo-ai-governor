# PRD + 技术方案 + 架构蓝图 Review 报告

- Status: pending-review
- Date: 2026-03-18
- Reviewer: AI
- Scope: `docs/product-requirements.md`, `docs/repo-ai-governor-overall-technical-solution.md`, `docs/repo-ai-governor-architecture-and-repo-layering.md`
- Related: `docs/product-requirements-brief.md`, `code_standards.md`, `docs/governance/long-term-maintenance-guide.md`

---

## 一、跨文档不一致（需同步修复）

### 1. Notification 层在两份文档中定位不同

- **架构蓝图** 将 `Notification Dispatcher` 和 `Notification Providers` 作为独立的 **Notification Integration Layer**（蓝图 § 2 Mermaid 图中为独立 subgraph）。
- **技术方案 § 4.1** 的 8 层模型中 **没有 Notification 层**，§ 4.2 的 9 个核心引擎也没有 `Notification Dispatcher`。

**建议**：在技术方案的分层视图中补充 Notification 层，或将其明确归入 Governance Core Layer 并在 § 4.2 核心引擎列表中登记 `Notification Dispatcher`。两份文档的层定义必须对齐。

### 2. 核心引擎列表 vs 架构图节点不对齐

技术方案 § 4.2 列了 9 个引擎：

1. Process Compiler
2. Process Runtime
3. Policy Gate Engine
4. Agent Coordinator
5. Audit Recorder
6. Memory Manager
7. Shared Session Manager
8. Memory Store Adapter
9. Role Registry

架构蓝图 Mermaid 图中：

- 多了 `NotifyDispatcher`、`Report Builder`、`Replay/Explain`
- `Memory Store Adapter` 在架构图中是 packages 层模块，而技术方案把它列为"核心引擎"

**建议**：统一术语体系 —— 引擎（Engine）= 运行时核心组件；Adapter/Provider = 可插拔基础设施。`Memory Store Adapter` 和 `Report Builder` 应归为基础设施而非引擎。

### 3. 实施路线图与 PRD 优先级缺少映射

三份文档各有一套分期体系，且互相独立：

| 来源 | 分期名称 | 内容 |
|------|----------|------|
| 技术方案 § 11 | Phase A-E | DSL → Policy → Adapter → Audit → Hardening |
| PRD § 10 | P0/P1/P2 | MVP 已完成 / 增强中 / 平台化规划中 |
| 架构蓝图 § 7 | Step 1-7 | 边界先行 → 核心抽离 → ... → 契约测试 |

**建议**：新增一张 **Phase-Priority-Migration 对照矩阵**，明确每个 PRD 优先级对应哪些 Phase 和哪些 Migration Step，确保实施节奏一致。

### 4. 用户自定义角色在 PRD 中缺少显式需求条目

技术方案 § 6.4 详述了自定义角色模型（`role_profile_id`, `display_name`, `responsibilities`, `capabilities`, `permission_ceiling` 等），但 PRD § 8.5.1 只提到默认角色（Planner/Architect/Coder/Tester/Reviewer/Verifier）。

**建议**：如果自定义角色是 P1 需求，应在 PRD § 10 P1 列表中补充"用户自定义角色注册与管理"条目，否则需求可追溯性断裂。

---

## 二、技术方案缺漏

### 5. 缺少错误模型与恢复策略

设计原则 § 2.5 声明"可降级可恢复"，但全文缺少支撑机制：

- 无错误分类体系（transient / permanent / policy-blocked）
- 无 stage 级别重试语义（幂等要求？最大重试次数？）
- 无 circuit breaker 或 exponential backoff 策略
- Process Runtime 遇到 Agent 不可用时的具体行为未定义

**建议**：新增 § 5.3 或独立章节"错误模型与恢复策略"，至少定义：
1. 错误分类枚举
2. Stage 重试契约（幂等性要求、maxRetries、backoff 策略）
3. Agent 不可用时的降级流程
4. Flow 级别的 circuit breaker 阈值

### 6. 缺少取消与超时模型

多 Agent 流程可能运行数分钟到数小时，当前设计未覆盖：

- 用户如何取消正在执行的多 Agent 流程？
- Stage timeout / Flow timeout / Agent invocation timeout 各自策略是什么？
- 取消后的 cleanup semantics（已产生的中间产物如何处理？会话是否归档？台账记录什么状态？）

**建议**：在 § 5 或 § 6 中补充取消/超时模型，至少定义：
1. `cancel()` 语义与传播路径
2. 三级超时（Agent 调用 / Stage / Flow）
3. 取消后产物的保留/清理策略
4. 审计事件中的 `cancellation_reason` 和 `timeout_indicator` 字段

### 7. 缺少并发控制机制

多 Agent 共享 session（§ 4.3.3 和 § 6.5）的场景下：

- 两个 Agent 同时修改同一文件时怎么处理？
- Session 增量回写的冲突解决策略未定义（last-writer-wins / OT / CRDT？）
- 并行节点结果聚合失败（部分成功、部分失败）的处理未定义

**建议**：新增并发控制章节，至少定义：
1. 文件级锁或乐观并发控制策略
2. Session 增量写入的冲突检测与解决机制
3. 并行节点的 aggregation policy（allOf / anyOf / majority）

### 8. Process Compiler 输出格式未定义

§ 4.2 提到"编译为可执行状态机（DAG）"，缺少：

- 状态机中间表示（IR）的数据结构定义
- DAG 是否可持久化/可序列化，用于断点恢复
- 编译错误报告格式与用户反馈方式

**建议**：在 § 4.2 或独立章节中定义 Process IR schema（至少列出 node type、edge type、metadata 字段），并说明是否支持 checkpoint/resume。

### 9. 缺少 Token / Cost 预算机制

多 Agent 编排可能大量消耗 API 调用。当前设计对资源消耗没有任何约束：

- 无流程级 token 预算上限
- 无 stage 级别预算分配策略
- 超预算时的行为未定义

**建议**：在 Agent 契约 § 6.2 中补充 `token_budget` / `max_cost` 字段，在 Process Runtime 中增加预算守卫逻辑。超预算时应能触发 `block` / `escalate` / `degrade` 策略。

### 10. Slot 脚本安全模型不足

PRD § 8.4 和技术方案 § 8.3 都提到"脚本扩展需审计"，但缺少具体安全实施细节：

- 没有沙箱执行环境定义（VM isolate / subprocess / container？）
- 没有资源限制（CPU / 内存 / 执行时间上限）
- 没有文件系统/网络访问权限控制
- 没有脚本签名或信任链机制

**建议**：新增"脚本扩展安全模型"章节，定义：
1. 执行隔离方式（推荐 subprocess + 资源限制）
2. 默认权限白名单（可读路径、可写路径、网络访问）
3. 脚本超时与资源限制
4. 可选的签名验证机制（用于共享 slot 场景）

---

## 三、架构蓝图缺漏

### 11. Monorepo 版本策略未定义

目标结构 § 5 定义了 `apps/` + `packages/` 的 Monorepo 组织，但未提及版本管理策略：

- 各 package 是 independent versioning 还是 lockstep？
- `shared-types` 发生 breaking change 时，依赖包如何传播升级？
- 用什么工具管理版本（changesets / Nx release / lerna？）

**建议**：在 § 5 或 § 8 中补充版本策略章节。

### 12. 依赖方向约束没有自动化执行手段

§ 6 列了 13 条依赖方向规则，但没有提到用什么工具 enforce。人工遵守 13 条依赖规则在多人协作中不可持续。

**建议**：明确引入 `dependency-cruiser`、`eslint-plugin-import/no-restricted-paths` 或 Nx boundaries 等工具，并在 `code_standards.md -> Verification Commands` 中注册对应检查命令。

### 13. 目标结构缺少跨包测试目录与 e2e 位置

当前目标结构只有各 package 内 `test/`，没有定义：

- 跨包集成测试存放位置
- E2E 测试统一目录
- Contract test 的存放策略

**建议**：在 root 层补充 `test/integration/` 和 `test/e2e/` 目录，并在 § 5 中标注。§ 7 Step 7 提到契约测试但没有对应目录，需补充。

### 14. 缺少 Public API Surface 定义

如果目标用户想基于 governor 构建自定义工具（programmatic API 而非 CLI），目前没有定义哪些模块导出 public API、哪些是 internal。

**建议**：在蓝图中标注每个 package 的 visibility（public / internal），并在 package.json `exports` 中显式约束。

---

## 四、PRD 缺漏

### 15. 缺少数据隐私与审计日志保留策略

审计日志可能包含代码片段、commit 信息、AI 对话内容等敏感数据：

- 日志默认保留期限未定义
- 无可清除/脱敏机制
- 未说明是否需要 GDPR 等合规考量

**建议**：在 PRD § 13 非功能需求"安全性"或"可审计性"中补充数据保留策略条目。

### 16. 缺少离线 / 网络受限场景说明

企业内网环境可能无法访问外部 AI API：

- 离线模式下治理能力范围未定义
- 本地模型（如 Ollama）接入路径未提及
- 如果是 Out Of Scope 应在 § 5 中明确标注

**建议**：在 PRD § 5 "非目标" 中明确离线场景定位，或在 § 8.7 中补充本地模型适配路径。

### 17. CI 集成覆盖范围过窄

§ 17.5 和 § 8 只提了"基础 CI 集成"，实际上只涵盖了 GitHub Actions：

- GitLab CI、Jenkins、Azure Pipelines、CircleCI 等未提及
- 如果是 Out Of Scope 应明确标注
- 如果计划覆盖，应在 P1/P2 中列出优先级

**建议**：在 § 17.5 中补充 CI 平台覆盖策略（首批 vs 后续扩展），或明确标注 MVP 仅支持 GitHub Actions。

### 18. 缺少"升级与迁移"的用户体验设计

§ 8.1 提到 `upgrade` 命令，但缺少关键设计：

- 配置 Schema 版本迁移策略（如 governor.yaml v1→v2 如何自动迁移？）
- 规范包大版本升级时的冲突合并策略
- 用户能否 pin 旧版规范包
- 升级失败时的回滚机制

**建议**：新增 § 8.10.x 子节详述升级/迁移 UX，至少定义 schema migration、conflict resolution、rollback 三个关键流程。

---

## 五、小修建议

| # | 位置 | 现状 | 建议 |
|---|------|------|------|
| 19 | 技术方案 § 9.3 | 审计事件最小字段缺 cancellation 相关 | 补充 `cancellation_reason` 和 `timeout_indicator` 字段 |
| 20 | 技术方案 § 6.2 | Agent 契约无资源限制字段 | 补充 `max_execution_time` / `token_budget` 字段 |
| 21 | 架构蓝图 § 3 | Mermaid 时序图仅覆盖 happy path + HITL | 补充"取消/超时"分支 |
| 22 | PRD § 8.5 | Loop 节点有 `maxCycles` 约束 | 补充 `maxWallTime` 约束，防止无限时间循环 |
| 23 | 技术方案 § 4.3.1 | 永久记忆标注"低频变更" | 增加变更审计要求（谁改了规范、何时改的、变更 diff） |
| 24 | 全部三份文档 | 当前日期均为 `2026-03-18` | 后续维护时需同步更新时间戳，建议统一日期格式规范 |

---

## 六、优先级建议

### 高优先（阻塞实施 / 影响架构一致性）

- **#1** Notification 层定位不一致
- **#2** 核心引擎列表 vs 架构图不对齐
- **#3** 三套分期没有对照矩阵
- **#5** 缺少错误模型与恢复策略
- **#6** 缺少取消与超时模型
- **#7** 缺少并发控制机制

### 中优先（影响质量 / 安全 / 工程基础）

- **#4** 自定义角色需求可追溯性断裂
- **#8** Process Compiler IR 未定义
- **#9** 无 Token/Cost 预算机制
- **#10** Slot 脚本安全模型不足
- **#11** Monorepo 版本策略缺失
- **#12** 依赖方向约束无自动化执行

### 低优先（完善性 / 可后续补充）

- **#13** 跨包测试目录缺失
- **#14** Public API Surface 未定义
- **#15** 数据隐私与日志保留策略
- **#16** 离线/网络受限场景
- **#17** CI 集成覆盖范围
- **#18** 升级与迁移 UX
- **#19-#24** 小修项

---

## 复核结论（2026-03-18）

### 整体结论：部分认可

本报告多数问题识别有效，但有部分条目已被后续文档更新覆盖，或原始证据表述不够准确。逐条判定如下：

1. `#1`：**部分认可**
   - 架构蓝图中 Notification 已独立成层；技术方案已补 `Notification Dispatcher`（§4.2），但技术方案 §4.1 分层未显式出现 Notification 层，仍存在轻微表述不对齐。
2. `#2`：**部分认可**
   - “技术方案无 Notification Dispatcher”已失效；但“引擎 vs 适配器/报告组件术语边界”仍不完全一致，建议后续统一命名口径。
3. `#3`：**认可**
   - 仍未见 Phase / Priority / Migration 的统一对照矩阵。
4. `#4`：**认可**
   - PRD 有多 Agent 角色能力，但未显式列出“用户自定义角色注册/管理”的需求条目与优先级映射。
5. `#5`：**认可**
   - 技术方案仅有“可降级可恢复”原则，未落到错误分类、重试、熔断等执行契约。
6. `#6`：**认可**
   - 未定义取消语义与三级超时模型。
7. `#7`：**认可**
   - 共享 session 与并行执行存在，但冲突检测/并发控制策略未定义。
8. `#8`：**认可**
   - Process Compiler 提到 DAG，但 IR schema、持久化与编译错误契约未定义。
9. `#9`：**认可**
   - Agent 契约和运行时未定义 token/cost 预算控制。
10. `#10`：**部分认可**
   - PRD 已要求“脚本扩展具备权限控制、执行审计和失败隔离”，但执行隔离、资源限制、权限白名单等技术细节仍缺。
11. `#11`：**认可**
   - 架构蓝图未定义 monorepo 版本策略（lockstep/independent/发布工具）。
12. `#12`：**认可**
   - 依赖方向约束已定义，但缺少自动化 enforce 方案与门禁接入说明。
13. `#13`：**认可**
   - 蓝图未定义跨包 integration/e2e/contract 测试目录策略。
14. `#14`：**认可**
   - 未定义 package public/internal API surface。
15. `#15`：**认可**
   - PRD 未显式定义审计日志保留、脱敏、删除策略。
16. `#16`：**认可**
   - PRD 未明确离线/受限网络场景边界或本地模型路径。
17. `#17`：**部分认可**
   - “只涵盖 GitHub Actions”这一表述证据不足；但“CI 平台覆盖策略未显式定义”问题成立。
18. `#18`：**部分认可**
   - PRD §8.10 已有“配置迁移/版本锁定/回滚”方向性要求，但缺少具体 UX 与冲突处理流程。
19. `#19`：**认可**
   - 审计字段未包含 `cancellation_reason` / `timeout_indicator`。
20. `#20`：**认可**
   - Agent 契约未包含 `max_execution_time` / `token_budget` 等资源字段。
21. `#21`：**认可**
   - 时序图未覆盖取消/超时分支。
22. `#22`：**部分认可**
   - 当前 PRD 未显式定义 `maxCycles`，因此原文“已有 maxCycles”不准确；但补充 `maxWallTime` 约束建议本身合理。
23. `#23`：**认可**
   - 永久记忆定义了低频变更，但未定义规范变更审计机制。
24. `#24`：**部分认可**
   - 当前日期一致本身不构成缺陷，但“后续维护需统一更新时间与日期格式”属于合理治理建议。

### 复核命令与结果

1. `sed -n '1,260p' docs/review-prd-tech-solution-architecture.md`
2. `sed -n '1,320p' docs/repo-ai-governor-overall-technical-solution.md`
3. `sed -n '1,340p' docs/repo-ai-governor-architecture-and-repo-layering.md`
4. `sed -n '1,760p' docs/product-requirements.md`
5. `rg -n "Notification|role_profile_id|maxCycles|rollback|..." docs/repo-ai-governor-overall-technical-solution.md docs/repo-ai-governor-architecture-and-repo-layering.md docs/product-requirements.md`

结果：复核完成，结论为“部分认可”；原报告需按上方逐条判定更新后再进入后续修复阶段。

---

## 修复执行清单（基于复核结论，2026-03-18）

### Wave A（高优先，建议先做）

1. `#1 + #2` 文档架构术语对齐
   - 目标：统一“分层”和“核心引擎/基础设施”定义边界。
   - 修改范围：
     - `docs/repo-ai-governor-overall-technical-solution.md`（§4.1, §4.2）
     - `docs/repo-ai-governor-architecture-and-repo-layering.md`（§2, §4）
   - 验收要点：
     - Notification 层归属在两文档中一致。
     - `Engine` 与 `Adapter/Provider` 分类一致且无冲突描述。

2. `#3` 新增 Phase/Priority/Migration 对照矩阵
   - 目标：把 PRD 优先级与技术方案/架构迁移步骤绑定。
   - 修改范围：
     - `docs/repo-ai-governor-overall-technical-solution.md`（§11 或新增附录）
     - `docs/repo-ai-governor-architecture-and-repo-layering.md`（§7 引用）
     - `docs/product-requirements.md`（§10 引用）
   - 验收要点：
     - 至少包含 `P0/P1/P2 -> Phase A-E -> Step 1-7` 的一张显式表格。

3. `#5 + #6 + #7` 运行时可靠性模型补齐
   - 目标：补全错误模型、取消/超时、并发控制三件套。
   - 修改范围：
     - `docs/repo-ai-governor-overall-technical-solution.md`（建议新增独立章节）
     - `docs/repo-ai-governor-architecture-and-repo-layering.md`（时序图补分支）
   - 验收要点：
     - 错误分类、重试契约、降级路径、circuit breaker 阈值明确。
     - `Agent/Stage/Flow` 超时语义明确。
     - 共享 session 并发冲突策略与并行聚合策略明确。

### Wave B（中优先）

1. `#4` PRD 增加自定义角色需求可追溯条目
   - 修改范围：`docs/product-requirements.md`（§10 P1）。
2. `#8` Process IR 契约补齐
   - 修改范围：`docs/repo-ai-governor-overall-technical-solution.md`（§4.2 附 IR schema）。
3. `#9 + #20` 预算与资源上限
   - 修改范围：技术方案 `§6.2 + §9.3`。
4. `#10` Slot 脚本安全模型细化
   - 修改范围：PRD `§8.4/§17.3` + 技术方案 `§8`。
5. `#11 + #12` 工程治理补齐
   - 修改范围：架构蓝图 `§5/§6` + `code_standards.md`（先备忘，后接门禁）。

### Wave C（低优先/完善性）

1. `#13 + #14` 测试目录与 Public API surface 策略。
2. `#15 + #16 + #17` 隐私保留、离线场景、CI 平台覆盖策略。
3. `#18 + #19 + #21 + #22 + #23 + #24` 升级 UX、小修字段和文档治理完善项。

### 执行顺序建议

1. 先完成 Wave A（避免后续实现基于不一致设计推进）。
2. Wave B 与 Wave C 可并行拆分为 PRD 流、技术方案流、架构蓝图流三条子任务线。
3. 每个波次完成后同步更新 `docs/product-requirements-brief.md`，确保 AGENTS 执行入口与主 PRD 一致。

---

## Wave A 执行记录（2026-03-18）

1. `#1 + #2` 已执行
   - 技术方案分层中明确 `Notification & Escalation Layer`，并统一 `Engine` 与 `Adapter/Provider` 边界。
   - 架构蓝图分层与术语已同步为 `Memory & Context / Notification & Escalation / Agent Runtime & Adapter / Delivery & Operations`。
2. `#3` 已执行
   - 在三份文档中建立并对齐同一张 `Priority-Phase-Migration` 对照矩阵：
   - `docs/repo-ai-governor-overall-technical-solution.md`（`§11.1`）
   - `docs/repo-ai-governor-architecture-and-repo-layering.md`（`§7.1`）
   - `docs/product-requirements.md`（`§10.1`）
3. `#5 + #6 + #7` 已执行
   - 技术方案已补充错误模型、取消/超时、并发控制契约（`§5.3` 到 `§5.5`）。
   - 架构时序图已补齐 `stage timeout`、`cancel()` 与中断快照/审计分支。

执行结论：Wave A 目标已完成，可进入 Wave B。

---

## Wave B 执行记录（2026-03-18）

1. `#4` 已执行（自定义角色可追溯）
   - `docs/product-requirements.md` 的 `P1` 已新增“用户自定义角色注册与治理（Role Registry + role_profile_id 生命周期）”条目。
2. `#8` 已执行（Process IR 契约）
   - `docs/repo-ai-governor-overall-technical-solution.md` 已新增 `§4.2.2 Process Compiler IR 契约（Draft v1）`。
3. `#9 + #20` 已执行（预算与资源上限）
   - 技术方案 `§6.2 Agent 契约` 新增 `max_execution_time_seconds/token_budget/cost_budget/time_budget_seconds` 等字段。
   - 技术方案 `§9.3 审计字段` 新增预算消耗与执行时长字段。
   - PRD `§8.5.1` 的 Agent 协议字段已同步补齐。
4. `#10` 已执行（Slot 脚本安全模型）
   - 技术方案新增 `§8.5 Slot 脚本安全执行模型`（权限白名单、资源限制、I/O 契约、失败隔离、审计字段）。
   - PRD `§8.4` 与 `§17.3` 已同步脚本扩展安全基线。
5. `#11 + #12` 已执行（工程治理补齐）
   - 架构蓝图新增 `§5.1 Monorepo 版本与发布策略`。
   - 架构蓝图新增 `§6.1 依赖方向自动化执行备忘（Pending Integration）`。
   - `code_standards.md` 已新增版本/依赖边界基线与待接线命令备忘（不启用 gate）。

执行结论：Wave B 本轮目标已完成，可进入 Wave C 或直接转实现任务拆分。

---

## Wave C 执行记录（2026-03-18）

1. `#13` 已执行（跨包测试目录）
   - 架构蓝图根目录新增 `tests/contract`、`tests/integration`、`tests/e2e` 结构，并在 Step 7 绑定目录基线。
2. `#14` 已执行（Public API Surface）
   - 架构蓝图新增 `§6.2 Package Public API Surface 约束`，定义 public/internal 分层与 `exports` 约束。
3. `#15` 已执行（隐私与保留策略）
   - PRD 新增 `§13.1 数据隐私与审计日志保留策略`（保留周期、脱敏、导出删除、合规扩展）。
4. `#16` 已执行（离线/受限网络）
   - PRD 在 `§5` 明确 MVP 离线边界，并在 `§8.7` 增加 restricted network mode 与本地模型适配路径。
5. `#17` 已执行（CI 覆盖范围）
   - PRD `§17.5` 新增 CI 平台覆盖策略（P0 GitHub Actions，P1 GitLab/Jenkins，P2 Azure/CircleCI）。
6. `#18` 已执行（升级迁移 UX）
   - PRD 新增 `§8.10.1 升级与迁移 UX 基线`（schema 迁移、冲突处理、回滚、版本 pin）。
7. `#22` 已执行（Loop 时间约束）
   - PRD `§8.5` 与技术方案 `§5.2` 均明确 Loop 必须声明 `maxCycles + maxWallTimeSeconds`。
8. `#23` 已执行（永久记忆变更审计）
   - 技术方案 `§4.3` 增加规范资产变更审计字段要求（`changed_by/changed_at/change_reason/diff_ref`）。
9. `#24` 已执行（日期格式治理）
   - PRD、技术方案、长期维护指南均增加文档日期格式 `YYYY-MM-DD` 与联动更新约束。
10. `#19/#21` 状态说明
   - 相关项已在 Wave A 完成（审计取消/超时字段 + 时序图取消/超时分支），本轮保持一致性。
11. 简版入口同步
   - `docs/product-requirements-brief.md` 已同步 Wave B/Wave C 关键约束（角色治理、预算约束、Slot 安全、Loop 时间约束、受限网络边界）。

执行结论：Wave C 目标已完成，复核清单当前可转入“实现任务拆分与交付计划”阶段。
