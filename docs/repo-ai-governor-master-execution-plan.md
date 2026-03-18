# Repo AI Governor 总执行计划（Master Plan）

- Status: active
- Date: 2026-03-18
- Scope: 项目级（不绑定当前 sprint/context）
- Sources:
  - [product-requirements.md](./product-requirements.md)
  - [repo-ai-governor-overall-technical-solution.md](./repo-ai-governor-overall-technical-solution.md)
  - [repo-ai-governor-architecture-and-repo-layering.md](./repo-ai-governor-architecture-and-repo-layering.md)

## 1. 目标与边界

本计划用于指导 `repo-ai-governor` 全项目重构与演进，不依赖现有执行上下文，直接以 PRD、总技术方案、架构蓝图为唯一输入。

目标：

1. 落地“多 Agent + 可插拔 AI 工具 + 流程治理 + 必要人工介入”的产品主线。
2. 完成 monorepo 分层重构，建立清晰依赖边界与可扩展 provider/adapter 体系。
3. 形成稳定的 workspace、memory、shared session、audit、notification 基础设施。
4. 打通从开发到发布的质量门禁、契约测试、回归与审计链路。

非目标（本计划范围外）：

1. 第一阶段不建设重型云端控制平面。
2. 不将可视化编排平台作为当前主线交付阻塞项。

## 2. 基线判断（来自三份源文档）

1. P0 能力已具备（可安装、可初始化、最小治理闭环）。
2. 当前主攻为 P1（进行中）：多 Agent 运行时、策略化 HITL、多工具适配、workspace 生命周期。
3. P2（规划中）以“平台化扩展”方式预留，不阻塞 P1 主线收敛。

## 3. 总体执行策略

1. 先边界后抽离：先做目录边界与依赖方向约束，再做核心模块迁移。
2. 先契约后实现：优先明确 DSL、policy、session/memory、adapter/provider 的契约。
3. 先回归基线后重构：关键命令建立 golden/contract/integration/e2e 基线后再大规模拆分。
4. 先内聚核心再开放扩展：先稳定 `core-*`，再扩展 `adapters/*`、`memory-providers/*`、`notification-providers/*`。
5. 全程 HITL 可控：关键升级节点必须支持通知分发与人工决策回灌。

## 4. Phase-Step 对齐主表

| 阶段 | 对齐 PRD Priority | 技术阶段 | 架构迁移 Step | 交付焦点 |
|---|---|---|---|---|
| Stage 0 | P0 已完成校准 | Phase A/B 校准 | Step 1（边界先行） | 基线冻结、边界治理、回归基线建立 |
| Stage 1 | P1 | Phase B | Step 2 | 核心包抽离：process/policy/role/memory/session/notification/adapter-sdk |
| Stage 2 | P1 | Phase C | Step 3~5 | memory/notification provider 落地与 adapters 模块化 |
| Stage 3 | P1 | Phase D | Step 6 | CLI 入口瘦身，编排层与执行层彻底解耦 |
| Stage 4 | P1->P2 过渡 | Phase E | Step 7 | 契约测试、发布硬化、可回放审计闭环 |
| Stage 5 | P2 预留 | 平台扩展阶段 | 平台扩展步骤 | 平台化能力接口预留与增量交付 |

## 5. 里程碑计划（项目级）

### M0 基线校准与执行面收口

交付：

1. 完成“总计划 + 模块清单 + 风险清单 + 验证清单”冻结版本。
2. 建立 Step 1 约束：目录边界、依赖方向约束、命名规范落地。
3. 建立回归基线：`init/doctor/plan/check/run/review/review-verify/report`。

退出条件：

1. 后续重构均可通过同一回归基线验证。
2. 架构边界规则可检查且有违规告警机制。

### M1 核心引擎包化（Core Extraction）

交付：

1. 抽离 `core-process`、`core-policy`、`core-role-registry`。
2. 抽离 `core-memory`、`core-session`、`notification-dispatcher`、`memory-store-adapter`、`adapter-sdk`。
3. 统一接口与错误模型，补齐最小单元测试。

退出条件：

1. CLI 可通过新包接口运行主链路。
2. 核心包 API 边界稳定，内部依赖方向无逆向违规。

### M2 Workspace + Memory + Session 稳定化

交付：

1. workspace 双模式：默认 `tool_managed`，可选 `repo_local`。
2. workspace 迁移策略：`copy/verify/switch` 与失败回滚。
3. 双层记忆模型：`normative_knowledge_sources` + `operational state`。
4. 共享 session（`execution_session_id`）跨 Agent 协同与快照回放能力。

退出条件：

1. 未配置 workspace 时稳定落默认模式。
2. 多 Agent 在同 session 下可共享上下文且可审计追踪。

### M3 多 Agent 编排与 HITL 闭环

交付：

1. 编排 DSL/IR v1：`Sequential/Parallel/Loop/Condition`。
2. Policy Gate 与 HITL 触发、人工决策回灌。
3. Notification Dispatcher 与 provider 接入（`webhook` 基线 + 回退策略）。
4. 用户自定义角色模型与 `role_profile_id` 生命周期治理。

退出条件：

1. 关键阶段能稳定触发人工闸口并记录通知回执。
2. 角色、技能、路由、策略的职责边界在实现与文档保持一致。

### M4 适配层与入口瘦身

交付：

1. 适配器模块化：`packages/adapters/*`（首批 Codex/Copilot/Claude）。
2. `apps/cli` 仅保留路由/参数编排，核心逻辑下沉 packages。
3. Slot 安全执行模型与权限边界接入运行时。

退出条件：

1. 多工具接入遵循统一 adapter 协议并支持降级回退。
2. CLI 入口复杂度显著下降，命令层不再承载核心业务逻辑。

### M5 质量硬化与发布就绪

交付：

1. 测试矩阵落地：`tests/contract`、`tests/integration`、`tests/e2e`。
2. 依赖边界、版本策略、契约回归纳入 CI 门禁。
3. 发布流程支持 `canary -> rc -> ga`，并具备审计回放报告。

退出条件：

1. 核心门禁稳定通过，发布链路可重复执行。
2. 达到对外发布质量门槛。

## 6. 工作流分解（Workstreams）

1. WS-A 架构与包边界：monorepo 分层、依赖方向、公共 API 面约束。
2. WS-B 运行时内核：process compiler/runtime、policy gate、role/session/memory。
3. WS-C 适配生态：adapter-sdk、adapters、skill 与 slot 接口治理。
4. WS-D 数据与状态：workspace、记忆、审计、报告、可回放快照。
5. WS-E HITL 与通知：升级阈值、人工决策、notification providers。
6. WS-F 质量与发布：contract/integration/e2e、版本策略、发布门禁。
7. WS-G 文档与实施治理：PRD/总纲/架构/执行计划四文档联动。

## 7. 依赖关系与关键前置

1. `M1` 依赖 `M0`（无回归基线不允许大拆分）。
2. `M2` 依赖 `M1`（先有 core memory/session 抽象再做 workspace 稳定化）。
3. `M3` 依赖 `M1+M2`（策略与 HITL 依赖 session/memory/notification 基座）。
4. `M4` 与 `M3` 可并行部分推进，但最终集成前需统一 adapter 契约。
5. `M5` 依赖全部前序里程碑完成并冻结 API。

## 8. 质量门禁（执行检查）

以 `code_standards.md -> Verification Commands` 为准，项目级关键门禁如下：

```bash
node ./scripts/governance/check-esm-import-specifiers.js
node ./scripts/governance/check-dynamic-import-usage.js
node ./scripts/governance/check-finite-literal-sets.js
node ./scripts/governance/check-utils-reuse-governance.js
node ./scripts/governance/check-type-governance.js
node ./scripts/governance/check-ts-only-residue.js
npm run test -- --maxWorkers=1 --maxConcurrency=1
node ./dist/bin/repo-ai-governor.js --help >/dev/null
```

## 9. 风险与缓解

1. 风险：重构跨度大导致功能回归。
   - 缓解：强制基线回归 + 分阶段合并 + 每里程碑可运行。
2. 风险：多 Agent 行为漂移导致执行不可控。
   - 缓解：统一 session、策略门禁、审计事件和通知闭环。
3. 风险：适配器生态碎片化。
   - 缓解：adapter-sdk 契约先行，provider/adapter 必须过契约测试。
4. 风险：workspace 切换导致状态丢失。
   - 缓解：`copy/verify/switch` 三阶段与失败回滚机制。

## 10. 执行产物建议（文档落位）

为避免后续实现偏离，建议在 `docs/` 下维护以下固定产物：

1. `docs/repo-ai-governor-master-execution-plan.md`（本文件）
2. `docs/project-status-report.md`（周级状态）
3. `docs/mvp-issue-backlog.md`（跨里程碑风险与问题池）
4. `docs/release-ga/`（发布前验收证据）

## 11. 变更同步规则

1. 若 `product-requirements.md` 的 Priority/范围更新，本计划需同窗口更新。
2. 若 `overall-technical-solution.md` 的 Phase 更新，本计划需同步 Stage 映射。
3. 若 `architecture-and-repo-layering.md` 的 Step/依赖方向更新，本计划需同步里程碑路径。
