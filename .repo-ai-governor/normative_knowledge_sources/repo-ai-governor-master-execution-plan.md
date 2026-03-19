# Repo AI Governor 从零到完成态总执行计划

- Status: active
- Date: 2026-03-19
- Role: execution master plan
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. 文档目标

1. 提供一份可指导 Repo AI Governor 从无到完成态的工具级执行计划。
2. 统一三套坐标：`PRD Priority`、`Technical Phase`、`Architecture Migration Step`。
3. 为后续拆解 `project/sprint/task` 提供可直接复用的骨架和验收标准。

## 2. 统一映射原则

1. 所有新增需求先标注 `P0/P1/P2`，再映射到 `Phase` 与 `Step`。
2. 若出现“高优先需求依赖后置步骤”，先补齐前置架构条件，再进入实现。
3. 以“目标仓库治理正确性”优先于“本仓库开发便利性”。
4. 结构化配置是唯一事实源，`AGENTS.md` 是投影视图。

## 3. 从零到完成态总路线图

| 阶段 | 对齐映射 | 目标 | 核心交付 | 退出门禁（DoD） |
|---|---|---|---|---|
| Stage 0: 启动与边界先行 | Migration Step 1 | 固化边界与事实链路 | 分层边界、依赖方向规则、三层文档同步门禁、`integrations/ci` 骨架 | 文档同步检查可阻断；依赖方向检查可运行；CI 可稳定触发门禁命令 |
| Stage 1: 最小可用内核 | Phase A + 里程碑 1 | 可安装可初始化 | npm 包、CLI 命令骨架、`packages/config`、workspace 双模式 | 新仓库接入时间 < 15 分钟；`tool_managed` 默认生效；迁移支持回滚 |
| Stage 2: 最小治理闭环 | Phase A/B + 里程碑 2 | 跑通受控研发流程 | Process DSL + Compiler IR、Runtime、Memory/Session/Store 基线、标准阶段产物落盘 | 流程跳步受限；重试/超时/取消可控；Memory 链路可稳定读写 |
| Stage 3: 策略与 HITL | Phase B | 效率与风险平衡 | 风险判定、策略门禁、人工回灌、通知分发、Standards Policy 基线 | 高风险动作必触发人工；策略决策可消费结构化规则；审计可追踪 |
| Stage 4: 规范与插槽体系 | Phase B/C + 里程碑 3 | 可扩展治理能力 | Standards Render/Project、Spec Sync Guard、Slot 双轨、升级 UX 闭环 | human/ai/agents 同源渲染一致；`AGENTS.md` 投影稳定；升级冲突与回滚可治理 |
| Stage 5: 多 Agent 与多工具适配 | Phase C + 里程碑 4 | 编排统一，执行开放 | Role Registry、Agent 契约、Adapter SDK、首批适配器、受限网络模式 | Codex/Copilot/Claude Code 在统一策略下可运行；外网受限时本地治理仍可执行 |
| Stage 6: 审计、回放与依赖产物运行时 | Phase D + 里程碑 5 | 可观测、可解释、可恢复 | Audit、Report、Replay、Artifact Registry + Dependency Resolver、CLI 三模式、隐私治理 | `json` schema 稳定；非 TTY 自动降级 `plain`；依赖缺失与隐私保留可策略化处置 |
| Stage 7: 强化与发布治理 | Phase E + Migration Step 7 | 工程完成态 | 契约测试、集成/E2E、性能稳定性、发布策略（lockstep + independent） | 核心契约全通过；发布链路可 canary->rc->ga；回归可控 |
| Stage 8: 平台化扩展 | P2 平台化阶段 | 组织级能力扩展 | 插槽市场、可视化配置/执行面板、组织级审计与策略分发 | 不破坏本地主线，可按模块独立演进 |

## 4. 各阶段执行清单（可直接拆任务）

## 4.1 Stage 0: 启动与边界先行

1. 固化目录分层与模块边界（直接采用 `pnpm workspace` 的 `apps/` + `packages/` 结构，并按架构蓝图登记模块归属与依赖方向）。
2. 落地依赖方向检查脚本与 CI 接线（`scripts/governance/check-package-dependency-boundary.js`；先 warning + 白名单，稳定后切换 block）。
3. 落地三层文档同步门禁（含 brief 同步）。
4. 建立最小质量门禁命令集合并接入 CI。
5. 建立 `integrations/ci/` 骨架（含 GitHub Actions 基线模板与通用 CLI 调用约定）。

## 4.2 Stage 1: 最小可用内核

1. 交付 npm 包与 CLI 入口：`init/doctor/check/run/review/review-verify/plan/upgrade`。
2. 交付 `packages/config` 基线（Config Loader、Schema Validator、Profile Resolver）。
3. 交付 workspace resolver：`tool_managed` 默认，`repo_local` 可选。
4. 交付 workspace 迁移链路：`copy -> verify -> switch -> rollback`。
5. 建立 TypeScript 工程基线（workspace tsconfig、包级 tsconfig、类型检查与构建脚本约定）。
6. 建立 i18n 工程基线（`packages/shared/src/i18n/`、locale 解析与 fallback、`zh-CN/en` 初始资源）。
7. 建立 Biome 工程基线（根级配置、workspace 复用、格式化与 lint 脚本、CI 无副作用校验命令）。
8. 建立升级流程骨架（`schema diff -> 自动迁移建议 -> 人工确认`）并接入 `upgrade` 命令入口。

## 4.3 Stage 2: 最小治理闭环

1. 交付 DSL 与 Process Compiler，并定义 IR v1 契约。
2. 交付 Runtime：`Sequential/Parallel/Loop/Condition`。
3. 交付 `core-memory`、`core-session`、`memory-store-adapter` 契约，并落地 `memory-providers/fs-csv` 基线实现。
4. 实施标准阶段流转与跳步限制。
5. 按执行项目 + sprint 产出并回写：
   - `plan.md`
   - `tasks/checklist.md`（单列表 + 条目下执行记录）
   - `tasks/tasks.csv`（追加式执行台账）
   - `tasks/TK-xxx.md`
   - `code-review/review_*.md -> verified_*.md -> resolved_*.md`

## 4.4 Stage 3: 策略与 HITL

1. 交付 Change Risk Evaluator（统一风险语义，不在 adapter 分叉）。
2. 交付 Policy Gate Engine（`allow/confirm/block/escalate`）。
3. 交付 HITL 决策回灌字段与流程回写。
4. 交付通知分发与回退（webhook baseline + email/chat-im/issue-system 扩展）。
5. 前移交付 Standards Pack 策略基线：`pack registry` + `policy rule compiler`，作为 Risk/Policy 的规则输入源。

## 4.5 Stage 4: 规范与插槽体系

1. 落地 Standards Pack：
   - `rule renderer`
   - `agents projector`
2. 落地 Spec Sync Guard，纳入统一门禁链路。
3. 落地 Slot Engine 声明式主路径（元信息/触发条件/依赖/冲突/阻断策略）。
4. 落地脚本插槽安全模型六项：受限沙箱默认执行、权限白名单与策略审批、资源限制、I/O 契约校验、失败隔离、审计字段接入。
5. 为 Standards Pack 增加多语言渲染能力，确保 `human/ai/agents` 三视图基于同一语义键按 locale 输出。
6. 补齐升级与迁移 UX 闭环：冲突清单生成（阻断/可自动修复/建议项）、失败一键回滚、规范包版本 pin 策略（major 固定 + minor/patch 策略）。

## 4.6 Stage 5: 多 Agent 与多工具适配

1. 落地 Role Registry（默认角色 + 用户自定义角色）。
2. 落地 Agent 协议与 capability matrix。
3. 落地 Adapter SDK。
4. 交付首批 adapters：`codex`、`github-copilot`、`claude-code`。
5. 落地 routeKey 主备路由与降级回退。
6. 落地受限网络模式（Restricted Network Mode）：外部模型不可达时仍可执行本地规则检查、流程编排与台账回写，并预留本地模型接入路径。
7. 建立 `integrations/ide/` 骨架，统一多入口规范注入与命令包装约定。

## 4.7 Stage 6: 审计、回放与依赖产物运行时

1. 落地 Audit Recorder 最小字段与统一事件模型。
2. 落地 Report Builder + Replay/Explain。
3. 落地 Artifact Registry + Dependency Resolver（注册/解析/策略处置）。
4. 落地 CLI 输出契约：`pretty/plain/json` + `--output/--verbosity/--no-color`。
5. 完成非交互自动降级与错误输出结构化字段。
6. 落地 i18n 门禁（locale key parity + fallback 可用性检查），并把 `output_locale` 问题纳入回放定位。
7. 落地审计隐私治理：默认 90 天保留策略（可配置）、写入前敏感信息脱敏、按 `execution_id/project/sprint/date range` 导出与删除能力。

## 4.8 Stage 7: 强化与发布治理

1. 建立跨包契约测试：
   - `adapter-sdk`
   - `memory-store-adapter`
   - `artifact-registry`
   - `notification-dispatcher`
   - `process DSL/IR`
   - `risk evaluator/policy decisions`
   - `standards projection parity`
2. 建立 `tests/contract`、`tests/integration`、`tests/e2e` 的稳定基线，测试框架统一采用 `Vitest`。
3. 实施发布策略：
   - `core-*`、`adapter-sdk`、`shared`：lockstep
   - `adapters/*`、`providers/*`：independent
4. 建立 `canary -> rc -> ga` 发布通道与回滚流程。
5. 增加受限网络模式与离线降级链路的稳定性回归测试。

## 4.9 Stage 8: 平台化扩展（P2）

1. 插槽市场与共享机制。
2. 可视化编排配置与执行面板。
3. 组织级审计与指标看板。
4. 云端同步与策略分发。

## 5. 并行治理主线（每阶段都必须执行）

1. 文档事实链路主线
   - 三层文档与 brief 同步门禁常开。
2. 质量门禁主线
   - 本地与 CI 使用同一验证命令与退出码语义；测试执行基线统一为 `Vitest`，格式化与 lint 基线统一为 `Biome`。
3. 安全权限主线
   - 默认最小权限，所有高风险动作统一走风险判定与 HITL。
4. 多语言主线
   - 中文/英文输出能力并行建设，统一 locale 解析与 fallback 策略，机器字段保持稳定。
5. workspace 生命周期主线
   - 默认 `tool_managed`，支持 `repo_local`，切换可回滚。
6. 受限网络主线
   - 外部模型不可达时，治理门禁、流程状态机与台账写入仍可独立运行。

## 6. Project 拆解建议（用于后续 project/sprint/task）

1. `project-001-foundation`
   - 覆盖 Stage 0-1（边界、门禁、安装初始化、配置与 workspace）。
2. `project-002-governance-core`
   - 覆盖 Stage 2-3（流程编排、策略门禁、HITL 与通知）。
3. `project-003-standards-and-slots`
   - 覆盖 Stage 4（规范体系、投影、插槽双轨安全）。
4. `project-004-agent-adapter-runtime`
   - 覆盖 Stage 5（角色模型、协议、适配器与降级）。
5. `project-005-observability-and-artifacts`
   - 覆盖 Stage 6（审计、回放、依赖产物、CLI 输出契约）。
6. `project-006-hardening-release`
   - 覆盖 Stage 7（契约测试、稳定性、发布治理）。
7. `project-007-platformization`
   - 覆盖 Stage 8（P2 平台化扩展）。

## 7. Sprint 与 Task 最小模板（建议）

## 7.1 Sprint 模板

1. `sprint goal`：单一可验证目标。
2. `scope`：仅包含同阶段能力，不跨阶段硬并行。
3. `entry criteria`：前置阶段 DoD 已满足。
4. `exit criteria`：功能通过 + 审计可追踪 + 文档同步 + CI 通过。
5. `risk list`：高风险路径、权限动作、人工闸口。

## 7.2 Task 模板

1. `task_id`, `title`, `owner`, `priority`, `due_date`, `status`。
2. `depends_on`（阶段依赖）与 `depends_on_artifacts`（产物依赖）。
3. `implementation_plan`, `verify_commands`, `expected_artifacts`。
4. `review_delta`, `recorded_at`。
5. 执行后必须回写：
   - `tasks/checklist.md`（条目下执行记录）
   - `tasks/tasks.csv`（追加式执行台账）

## 8. 完成态定义（工具级）

1. 任意目标仓库可在 15 分钟内接入并跑通最小治理闭环。
2. Codex/Copilot/Claude Code 可在统一流程、权限、门禁下协作。
3. 高风险变更全部可解释、可审计、可人工接管。
4. 规范资产同源渲染（human/ai/agents）一致，且三层文档同步门禁默认阻断生效。
5. 发布链路具备契约测试、回滚策略与稳定输出（`pretty/plain/json`）。
6. 规范违规率可度量并在持续迭代中呈下降趋势（至少具备门禁统计输出）。
7. 团队级共享规范包可在多个仓库中复用，并具备版本来源可追溯性。

## 9. 执行与维护规则

1. 若需求变化触及边界或原则，先更新本计划，再推进实现。
2. 若 PRD/总技术方案/架构蓝图发生语义变更，本计划需在同一变更集中同步。
3. 本计划用于指导 project/sprint/task 拆解，不替代阶段性执行记录文档。
