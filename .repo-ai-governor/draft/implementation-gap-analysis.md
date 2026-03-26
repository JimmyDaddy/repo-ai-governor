# Repo AI Governor 实现程度与目标态 Gap 分析

- 生成日期：2026-03-26
- 基于版本：product-requirements.md v0.3 / overall-technical-solution.md / architecture-and-repo-layering.md / master-execution-plan.md
- 分析范围：当前代码库实现 vs PRD 完成态 + GA Readiness 标准

---

## 1. 总体结论

当前代码库在核心运行时、策略引擎、适配器、编排服务层面已是**实质性实装**，不存在大面积骨架代码。主线架构（Stage 0-9 + Post-Stage-9 第一阶段）已完成。

当前与目标态之间的差距集中在四个维度：

1. **插件化与打包**（project-015 active）：memory provider 的内置注册表与可选插件机制尚未完成
2. **Desktop 集成层**（integrations/desktop）：仅有文档与示例配置，无 TypeScript 实装
3. **通知 Provider 具体实现**：notification-dispatcher 策略层完备，但 email / webhook / chat-im / issue-system 的具体渠道 provider 未见实装
4. **GA Readiness 运营证据**：§10.2 要求的量化信号（clean-room rehearsal、pilot 仓库、metrics 快照）是操作性验收，尚无完整证据链

---

## 2. 逐层 Gap 明细

### 2.1 已实装，与目标态基本对齐

| 模块 | PRD/方案 要求 | 当前实装 | 对齐程度 |
|---|---|---|---|
| CLI 命令集 | `init/doctor/check/run/review/review-verify/plan/upgrade` | 全部存在，含真实业务逻辑，非 stub | ✅ |
| Process Compiler (DSL→IR) | DSL 编译为可执行状态机 | `core-process/process-compiler.ts`，含完整校验与快照落盘 | ✅ |
| Process Runtime Facade | Sequential/Parallel/Loop/Condition 执行 | `core-runtime/process-runtime-facade.ts`，双 backend（legacy + langgraph）并存 | ✅ |
| LangGraph Runtime Backend | graph-first execution、checkpoint、recover | `core-runtime-langgraph`，787 行实装，parallel fan-out/fan-in、循环计数、超时强制 | ✅ |
| Local Orchestration Service Shell | CLI+Desktop 共用执行入口 | `core-orchestration-service` in-process shell + sidecar host + IPC client | ✅ |
| Orchestration Service Client | transport-neutral 执行契约 | `packages/orchestration-service-client`，完整接口定义 + shell 实现 | ✅ |
| Policy Gate Engine | allow/confirm/block/escalate | `core-policy/policy-gate-engine.ts`，规则匹配 + 升级阈值跟踪 | ✅ |
| Change Risk Evaluator | 风险事实归一化 | `core-change-risk/change-risk-evaluator.ts`，语义评分，路径/命令/权限多维 | ✅ |
| Audit Recorder | 结构化事件、脱敏、保留策略 | `core-session/audit-recorder.ts`，正则脱敏 + 保留期执行 | ✅ |
| Memory Manager | 规范知识源 + 执行状态源分层 | `core-memory/memory-manager.ts`，scoped 读写委托 | ✅ |
| Shared Session Manager | 跨 Agent 共享 session | `core-session/shared-session-manager.ts` | ✅ |
| Adapter SDK | probe/invokeStage/streamEvents/requestConfirmation/cancel | `adapter-sdk/agent-protocol.abstract.ts` + route-runner | ✅ |
| 首批适配器 | Codex / GitHub Copilot / Claude Code | 三个 adapter 包均有真实 CLI spawn 调用，非 mock | ✅ |
| Local Model Adapter | 受限网络/本地推理路径 | `packages/adapters/local-model` 存在 | ✅ |
| Standards Pack | pack registry / rule renderer / agents projector | `packages/standards` 含四类职责边界实装 | ✅ |
| Slot Engine | 声明式/脚本双轨、冲突策略 | `packages/slots/slot-engine.ts`，冲突解析与安全评估已实装 | ✅ |
| Artifact Registry | 注册/依赖解析/生命周期 | `packages/artifact-registry`，版本管理 + 生命周期状态机 | ✅ |
| Report Builder / Replay | 执行报告聚合 + 回放 | `packages/reporting` 含三个子模块 | ✅ |
| CLI Output Presenter | pretty/plain/json 三模式 | `cli-output-presenter.ts`，TTY 检测 + 降级 | ✅ |
| Config Loader / Schema Validator | 分层配置 + schema 校验 + 迁移 | `packages/config`，含 40KB 校验规则 + 迁移服务 | ✅ |
| Workspace Resolver | tool_managed / repo_local 双模式 | `workspace-resolver.ts` 含路径解析 + 迁移入口 | ✅ |
| Memory Store Adapter | 统一 Provider 契约 | `packages/memory-store-adapter` | ✅ |
| FS-CSV Provider | 本地文件/CSV 存储后端 | `memory-providers/fs-csv` 实装 | ✅ |
| SQLite-FS Provider | 本地 SQLite 持久化 | `memory-providers/sqlite-fs` 实装 | ✅ |
| Notification Dispatcher | 多渠道路由/重试/策略 | `notification-dispatcher.ts`，主/备/升级渠道路由 | ✅ |
| Role Registry | 默认角色 + 自定义角色 | `core-role-registry/role-registry.ts` | ✅ |
| 测试覆盖 | 单测 + 集成 + 契约 + E2E | 13+ integration/e2e 文件，含黑盒链路测试 | ✅ |
| HITL Runtime | confirm/escalate 执行链路 | `hitl-runtime.ts` + service-backed HITL 接线 | ✅ |
| Delivery Rehearsal | commit/PR draft 受控演练 | `delivery-rehearsal-runtime.ts` | ✅ |

---

### 2.2 存在 Gap 的区域

#### GAP-01：Desktop Client 实装缺失

- **目标（PRD §8.5 item 10 / 技术方案 §4.2.8 / 架构 §6.1 #19）**：
  - Desktop Client 通过 Local Orchestration Service 接入 runtime，只负责 presenter / HITL client，不持有 runtime 主状态
- **当前状态**：
  - `integrations/desktop/` 只有 `README.md` + `examples/desktop-sidecar-runtime.sample.json`
  - 无 TypeScript 实装，无 HITL 交互 UI，无 streaming 展示层
- **影响**：
  - Desktop surface 的 HITL 决策回灌路径无法真实演练
  - sidecar + IPC host 基础设施已完备（project-016），但"消费端"缺失
- **缺口等级**：P1（架构已支撑，需实装 UI 层）

#### GAP-02：通知渠道 Provider 实装缺失

- **目标（PRD §8.6 item 5 / 技术方案 §7.5 / 架构 §4 扩展点 #11）**：
  - 支持 `email / webhook / chat-im（Slack、Teams、钉钉、飞书）/ issue-system` 等渠道
  - 架构要求 `notification-providers/*` 子包可插拔
- **当前状态**：
  - `packages/notification-dispatcher/` 有完整策略路由层（主/备/升级渠道逻辑）
  - 但 `notification-providers/` 目录**不存在**，无具体渠道实现
  - 即：dispatcher 会调用 provider 接口，但实际没有任何真实渠道 provider
- **影响**：
  - HITL 通知在生产场景下无法送达外部渠道
  - GA Readiness §10.2 item 8 要求"至少 1 主 1 备 HITL 通知渠道 rehearsal 通过"无法满足
- **缺口等级**：P0（GA 阻断项）

#### GAP-03：Memory Provider Pluginization 未完成（project-015 active）

- **目标（PRD §10 P1 item 10 / master plan §3.3）**：
  - memory provider built-in registry + optional plugin 机制
  - 用户可在 `governor.yaml` 中声明第三方 provider 插件并按需加载
- **当前状态**：
  - FS-CSV 和 SQLite-FS 两个 provider 已实装，但以硬编码方式引入
  - 无 built-in registry 发现机制，无 optional plugin 加载点
  - project-015 仍为 active stream，正在推进中
- **影响**：
  - 无法支持 postgres 或自定义云端存储后端按配置切换
  - 企业场景的存储扩展路径被阻断
- **缺口等级**：P1（project-015 承接中）

#### GAP-04：Standards Pack 双视图渲染管道完整性待验证

- **目标（PRD §8.3 item 7/8 / 技术方案 §4.2.6）**：
  - 同一份规则资产统一生成 human / ai / agents 三类视图
  - AGENTS.md 投影由 `agents-projector` 自动从 pack registry 渲染，不手工维护
  - `policy-rule-compiler` 将强约束编译为 policy gate 可消费规则
- **当前状态**：
  - `standards/rule-renderer.ts` 已实装 locale 解析 + 插值渲染
  - `standards/agents-projector.ts` 存在，功能范围待验证
  - `policy-rule-compiler` 与 `spec-sync-guard` 子目录存在，但渲染→policy 编译→AGENTS.md 投影**是否形成真实闭环链路**未经端到端验证
  - 当前 AGENTS.md 是否由 canonical pack source 动态渲染，还是手工维护，尚不明确
- **影响**：
  - 规范资产"单一事实源→三视图"的核心承诺可能未落实
  - Standards Pack 与 Policy Gate 的语义对齐路径不可追踪
- **缺口等级**：P1（需要 E2E 链路验证）

#### GAP-05：i18n 资源覆盖度与 key parity 门禁

- **目标（技术方案 §4.2.7 / 架构 §6.3）**：
  - zh-CN / en 两套 locale 资源完整覆盖所有业务语义键
  - key parity 校验（键集一致性）+ fallback 可用性检查纳入质量门禁
  - 实施阶段：Stage 6 / Phase D 落地（已完成 Stage 6）
- **当前状态**：
  - `packages/shared/src/i18n/` 存在，i18next 基线已实装
  - `test/i18n-parity-fallback-gate.integration.test.ts` 存在（门禁测试）
  - 但 zh-CN / en 资源的**实际覆盖范围**（是否覆盖所有 domain 的语义键）未经全面核查
  - CLI 美化输出文案是否已完全 i18n 化不确定
- **影响**：
  - 非 zh-CN 用户的输出体验不可控
  - 若 key 缺失，CI 中的 parity gate 会误报或漏报
- **缺口等级**：P1（需资源清单核查）

#### GAP-06：Package Public API `exports` 声明

- **目标（架构 §6.2）**：
  - `public` 包（adapter-sdk / memory-store-adapter / notification-dispatcher / orchestration-service-client / reporting / shared）必须通过 `package.json → exports` 显式声明稳定入口
  - 不允许深层路径隐式导出
- **当前状态**：
  - 各包是否已在 `package.json` 中声明 `exports` 字段，以及声明是否覆盖全部公开 API 入口，尚未系统性核查
- **影响**：
  - 外部消费方可能通过深层路径 import，在包重构后静默破坏
  - 无法保证 `public` 包的 breaking change 可被工具链检测
- **缺口等级**：P1（需逐包核查）

#### GAP-07：Workspace 迁移三阶段（copy/verify/switch/rollback）完整性

- **目标（PRD §8.2 item 7 / 技术方案 §4.4 item 5）**：
  - `tool_managed` ↔ `repo_local` 切换必须支持 copy → verify → switch 三阶段，失败可 rollback
  - GA Readiness §10.2 item 6 要求在 clean-room 环境通过完整切换链路
- **当前状态**：
  - `config/workspace-migration-service.ts` 存在
  - 但三阶段原子性（特别是 verify 失败后 rollback 路径）是否完整实装，以及是否有对应集成测试，尚未确认
- **影响**：
  - 用户在模式切换失败时可能面临 workspace 状态丢失
- **缺口等级**：P1（需验证 rollback 路径）

---

### 2.3 GA Readiness 运营证据缺口（§10.2）

以下是 GA Readiness 量化信号中尚无明确证据链的项：

| §10.2 条目 | 要求 | 当前状态 |
|---|---|---|
| 1 | 至少 2 个试点仓库完成接入，单仓库 ≤15 分钟 | 无试点仓库记录 |
| 2 | clean-room 两种安装模式各连续 3 次通过 | 仅有单次 smoke 记录 |
| 3 | 黑盒路径矩阵 `init→doctor→check→run→report/replay` 100% 通过 | blackbox-governance-flow.e2e 存在，但连续 3 次记录缺失 |
| 4 | 无人值守链路连续 3 次 rehearsal 通过 | 单次 rehearsal 脚本存在，连续记录缺失 |
| 5 | 试点期失败事件全部结构化归因 | 无试点数据 |
| 6 | workspace 切换 clean-room 通过 | 见 GAP-07 |
| 8 | 至少 1 主 1 备 HITL 通知渠道 rehearsal 通过 | 见 GAP-02（provider 缺失） |
| 9 | 受控 delivery rehearsal 显式记录自动推送/发 PR 的开放边界 | rehearsal runtime 存在，但证据文档缺失 |
| 10 | 已声明最小支持矩阵 + clean-room smoke 记录 | 支持矩阵文档缺失 |
| 11 | 运营指标快照（接入耗时/违规率/成功率/回滚率/介入率） | 无运营数据 |

---

## 3. 缺口优先级汇总

| Gap ID | 描述 | 优先级 | GA 阻断 | 承接建议 |
|---|---|---|---|---|
| GAP-02 | 通知渠道 Provider 实装缺失 | P0 | ✅ 是 | 新增 `notification-providers/webhook` 基线 provider，补齐至少 1 主 1 备 |
| GAP-01 | Desktop Client 实装缺失 | P1 | 否 | `integrations/desktop/` 落地最小 TS 实现（HITL 交互 + streaming 展示） |
| GAP-03 | Memory Provider Pluginization | P1 | 否 | project-015 承接中，补齐内置 registry + plugin 加载机制 |
| GAP-04 | Standards Pack 三视图管道端到端验证 | P1 | 否 | 补 E2E 测试：pack → rule-renderer → agents-projector → AGENTS.md 投影链路 |
| GAP-05 | i18n key parity 覆盖度核查 | P1 | 否 | 核查 zh-CN / en 键集完整性，补缺失翻译键 |
| GAP-06 | package.json exports 声明核查 | P1 | 否 | 逐包补 `exports` 字段，特别是 6 个 public 包 |
| GAP-07 | Workspace 迁移 rollback 路径验证 | P1 | 否 | 补集成测试：切换失败→rollback→原状态验证 |
| GA-OPS | GA Readiness 运营证据链 | P1 | ✅ 是（整体） | 需要试点仓库 + 连续 rehearsal 记录 + metrics 快照 |

---

## 4. 最小交付路径建议

如果目标是推进至 GA，建议按以下顺序：

### Step A（解除 GA 硬阻断）
1. **GAP-02**：实装 `packages/notification-providers/webhook/`，接入 notification-dispatcher，完成 1 主 1 备 HITL rehearsal
2. **GA-OPS**：在本仓库执行 clean-room 安装验证 × 3，记录量化指标快照

### Step B（P1 功能收口）
3. **GAP-03**：project-015 完成 memory provider pluginization
4. **GAP-04**：补 Standards Pack 端到端投影链路验证测试
5. **GAP-06**：逐包核查并补全 `exports` 字段
6. **GAP-07**：补 workspace 迁移 rollback 集成测试

### Step C（平台化）
7. **GAP-01**：Desktop Client 最小 TS 实装（可作为 P2 起点）
8. **GAP-05**：i18n 键集全面覆盖（可随 desktop 一起推进）

---

## 5. 参考依据

- [PRD §10.2 GA Readiness 量化信号](../normative_knowledge_sources/product-requirements.md)
- [技术方案 §4.2 核心运行时引擎](../normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md)
- [技术方案 §7.5 通知渠道要求](../normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md)
- [架构 §6.1 依赖方向约束](../normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md)
- [架构 §6.2 Package Public API Surface](../normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md)
- [Master Plan §10 工具级完成态定义](../normative_knowledge_sources/repo-ai-governor-master-execution-plan.md)
