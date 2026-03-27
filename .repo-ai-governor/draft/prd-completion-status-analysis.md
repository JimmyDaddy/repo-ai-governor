# Repo AI Governor 需求完成情况分析

- Status: draft
- Date: 2026-03-27
- Scope: PRD v0.3 vs 当前实现状态综合分析
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`
  - `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/project-022-memory-semantics-safety-and-consumer-hardening-completion-audit-summary.md`
  - `.repo-ai-governor/context/completed-streams-history.md`

## 1. 总体结论

| 维度 | 完成度估计 |
|---|---|
| P0（MVP 必须具备） | ~85-90% |
| P1（增强能力，进行中） | ~70-75% |
| P2（平台化能力，规划中） | ~10-20% |
| **架构能力完成度** | ~80% |
| **外部产品化完成度** | ~60-65% |

**核心判断**：核心引擎和治理骨架已经很强，但"让目标仓库用户可靠采用"这个产品化目标与内部架构成熟度之间仍有明显差距。当前最重要的结构性偏差是：内部治理成熟度已高于外部产品化成熟度。

## 2. 已完成 / 基本完成的部分

### 2.1 CLI 与治理闭环（P0 ✓）

所有主要命令已落地，不再是空壳：

- `init`、`connect`、`doctor`、`check`、`run`、`review`、`review-verify`、`verify`、`plan`、`upgrade`

相关证据：`bin/repo-ai-governor.ts`、`apps/cli/src/constants/cli-command.constant.ts`

### 2.2 多 Agent 编排 + graph-first runtime（P1 ✓）

- `core-process`（流程 DSL 编译与 IR 生成）
- `core-runtime`（运行时门面）
- `core-runtime-langgraph`（graph-first backend）
- `core-orchestration-service` + `orchestration-service-client`（shared local service 路径）
- Sequential / Parallel / Loop / Condition 节点全部落地
- LangGraph backend 切换已通过 project-014 / project-016 完成

### 2.3 风险判定 / 策略门禁 / HITL（P1 ✓）

- `core-change-risk`：统一变更事实归一化与结构化风险输出
- `core-policy`：allow / confirm / block / escalate 四级决策
- `notification-dispatcher`：HITL 通知分发与升级策略
- `review → review-verify → ledger backfill` 子链已打通

### 2.4 Standards Pack / Slots / 三层文档同步（P1 ✓）

- `packages/standards`：pack registry / rule renderer / agents projector / standards upgrade planner
- `packages/slots`：声明式 + 脚本双轨，含权限白名单、资源配额、副作用声明与审计
- triad / brief / module-registry / lifecycle / promotion 整套治理门禁已落地（project-017 / project-018）

### 2.5 Memory 语义 / 安全硬化（P1 ✓，project-022 于 2026-03-27 完成）

- `workspace/user` 层已从活跃 recall baseline 降级为 reserved capability，contract 与实现边界重新对齐
- sensitivity / visibility 从记录型提示升级为 `allow / warn / redact / block` 4 层 policy stratification
- adopter-facing promotion output 已扩展到 `run` / `replay` CLI message、replay explain lines 与 replay diagnostics artifact summary
- `workspace/user` seam gate 完成 revalidation，明确保持 reserved capability，不伪造未满足条件的实现

### 2.6 审计 / 报告 / Artifact Registry / CLI 输出契约（P1 ✓）

- `packages/reporting`：执行报告构建、可解释输出与回放支持
- `packages/artifact-registry`：产物生命周期 active/frozen/deprecated/archived/retired
- pretty / plain / json 三种输出模式，TTY 自动切换，非交互场景自动降级

### 2.7 多工具适配骨架（P1 ✓）

- Codex / GitHub Copilot / Claude Code 适配器
- 本地模型适配路径（Ollama 类）
- 能力矩阵声明与降级策略

### 2.8 i18n 与 Workspace 持久化基线（P1 partial ✓）

- `packages/shared/src/i18n/`：i18next runtime baseline，zh-CN / en 基础已有
- `tool_managed` / `repo_local` 双模式 workspace 持久化
- `WorkspaceMigrationService`、`UpgradeSchemaDiffService`、`StandardsUpgradePlanner` 服务层已在

## 3. 仍有明显缺口的部分

### 3.1 打包分发真值未闭环（P0 最后一块）

`tgz / npm clean-room` 安装仍有已知限制（README 明确写明），"本地 path/link 可用"和"真实可分发 npm/tarball 可用"之间仍有断层。

影响：
- 很难宣称 P0 / P1 的外部采用面已真正完成
- 直接削弱"15 分钟接入"承诺的可信度

### 3.2 外部 adopter 产品化体验弱于内部治理（结构性偏差）

当前最成熟的是 triad / module / lifecycle / ledger / gate 等内部治理机制。PRD 的主目标是"治理目标仓库"，不是"无限深化本仓库治理元机制"。

影响：
- 容易继续把精力投入内部治理深化，而不是外部 adopter 体验
- 能力完成度看起来很高，但产品完成度并没有同步提高

### 3.3 upgrade / workspace lifecycle 仍偏工程基线

服务层能力（`WorkspaceMigrationService`、`UpgradeSchemaDiffService`）已有，但缺口在于：
- 用户级升级冲突处理路径不够清晰
- 外部 adopter 对"怎么升级、怎么回滚、什么时候会被阻断"的体验仍偏工程化
- 外部仓库升级演练与产品说明不够强

### 3.4 多语言（自然语言）和编程语言模板覆盖不足

- i18n 中英基础已有，但 Python / Go / Java / Rust 等语言治理模板的正式产品化证据不足
- 团队共享规范包的分发和消费体验尚未形成清晰产品面
- 官方 / 团队 / 仓库三层规范来源的外部消费路径未完整产品化

### 3.5 Desktop / P2 平台化仍停留在 contract 层

- `apps/` 目录仅有 `apps/cli`；`integrations/desktop` 主要是 README + sample
- 无可视化面板、云端同步、策略分发产品面或组织级审计看板的实际交付
- P2（插槽市场、可视化配置、组织级审计、云端同步）的主体还很远

## 4. P0 / P1 逐项对照

### P0（MVP 必须具备）

| PRD 条目 | 状态 | 说明 |
|---|---|---|
| npm 安装与初始化能力 | mostly_complete | CLI 骨架已有，tgz clean-room 仍有已知限制 |
| 仓库级治理配置 | complete | `governor.yaml`、config 服务、workspace 解析 |
| 标准流程模板（方案/拆解/开发/自测/评审/记录回写） | complete | 全流程已打通 |
| 基础规范包 | complete | `packages/standards` 含 registry/renderer/projector |
| 插槽机制 v1 | complete | `packages/slots` 声明式+脚本双轨 |
| CLI 运行与检查能力 | complete | 所有主要命令已落地 |
| 至少一种 AI 接入方式 | complete | Claude Code / Codex / Copilot 适配器已在 |
| 基础 CI 集成能力 | complete | GitHub Actions 一等模板，稳定退出码与 check gate |
| 执行报告输出 | complete | `packages/reporting`，pretty/plain/json 三模式 |

### P1（增强能力，进行中）

| PRD 条目 | 状态 | 说明 |
|---|---|---|
| 多模型统一适配层 | mostly_complete | 适配器骨架强，正式支持矩阵产品化偏弱 |
| 多 IDE / 多 Agent 工具适配 | mostly_complete | 入口契约完整，外部稳定支持矩阵不够产品化 |
| 编排 DSL / 流程图配置 v1 | complete | Sequential/Parallel/Loop/Condition 全落地 |
| 多 Agent 角色运行时与状态总线 | mostly_complete | shared session + coordination 已有 |
| 用户自定义角色注册（Role Registry） | complete | `packages/core-role-registry` |
| 自动模式 v1（含策略化人工闸口） | mostly_complete | HITL 主链已通，Stage 9 overlay 收口中 |
| 团队级共享规范包 | partial | 结构已有，外部分发与消费路径未完整产品化 |
| 编程语言模板扩展 | partial | TypeScript 最成熟，Python/Go/Java/Rust 产品化证据不足 |
| 更细粒度权限和门禁 | mostly_complete | 4 级权限 + risk evaluator 已有，深化空间尚在 |
| workspace 生命周期管理 | partial | 服务层已有，完整 adopter UX 尚不足 |
| 依赖产物注册与解析运行时 | complete | `packages/artifact-registry` + dependency resolver |
| CLI 输出体验与双模式结果 | complete | pretty/plain/json + TTY 自动降级 |
| 三层文档同步门禁 | complete | check-type-governance 等 governance scripts 覆盖 |

## 5. 当前执行焦点（Stage 9 Overlay）

Stage 9 是对 Stage 0-8 的投产与自治收口 overlay，当前正在收口的 6 类重点：

1. **真实 provider 调用与适配器运维契约**：至少覆盖 1 条远端 provider 路径和 1 条本地模型路径，补齐 health/timeout/retry/限流/脱敏/degrade path 契约
2. **任务驱动动态编排**：`run` 需按任务目标、依赖产物、角色能力与策略结果装配可执行 DAG，不停留在固定模板
3. **review 子链内联**：`review → review-verify → ledger backfill` 作为自动主链中的受控子链推进
4. **HITL 决策回灌**：`confirm/escalate` 返回的人工决策重新注入运行时，支持 resume/terminate/degrade
5. **受控交付演练**：`commit` / `PR draft` 在策略允许下作为 Delivery & Operations Layer 受控扩展运行，纳入 audit/replay
6. **黑盒与 GA 指标**：provider outage、restricted network、retry exhaustion 等路径黑盒覆盖，沉淀成功率、人工介入率等运营信号

**project-023（刚初始化）**：workspace migration artifact locality 和 scratch cleanup，属于工程整理项，为后续 adopter 产品化做铺垫。

## 6. 推荐优先序

基于当前能力状态与 PRD 主目标（"治理目标仓库"），推荐按以下顺序推进：

1. **补齐打包分发真值**（最优先）
   - 让 `tgz / npm clean-room` 真正跑通
   - 关闭"本地 path/link 可用，但真实分发不稳"的断层
   - 这是外部 adopter 的第一阻断，不解决后面产品化叙述都会失真

2. **upgrade / workspace lifecycle 做成完整 adopter UX**
   - 让 `init / doctor / upgrade / workspace migration / rollback` 成为外部用户可直接照着操作的闭环
   - 从"存在服务层能力"升级到"存在稳定用户路径"

3. **真实目标仓库产品化试点**
   - 在外部仓库验证接入耗时、升级成本、risk 提示、review 链路和 delivery rehearsal
   - 这才真正对齐 PRD 的主治理对象，可及时暴露"内部看起来完整、外部其实不好用"的问题

4. **收紧官方支持矩阵**
   - 明确哪些安装模式、适配器、IDE surface、语言模板是正式支持
   - 把"理论支持"收敛成"正式可承诺支持"

5. **P2 平台化暂缓**
   - 当前最大缺口不在平台化，而在 adopter 产品化
   - 优先做 dashboard / cloud / marketplace 会进一步放大结构性偏差

## 7. 三行摘要

**P0 接近完成（85-90%）**，核心卡点是打包分发真值（tgz clean-room）尚未完全闭环。

**P1 主干已落地（70-75%）**，但"架构能力存在"和"外部产品化体验成熟"之间仍有明显差距，特别是 upgrade UX 和 adopter 试点。

**P2 还很远（10-20%）**，当前应集中资源把 P0/P1 的外部产品化补齐，而不是继续扩张平台化能力或内部治理深度。
