# Repo AI Governor 从零到完成态总执行计划

- Status: active
- Date: 2026-03-24
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
5. 在 triad 尚未新增正式 `Phase F` 前，所有投产收口类工作统一表述为 `Phase E 收口 + GA Readiness overlay`，避免执行计划先于上游坐标体系漂移。

## 3. 从零到完成态总路线图

| 阶段 | 对齐映射 | 目标 | 核心交付 | 退出门禁（DoD） |
|---|---|---|---|---|
| Stage 0: 启动与边界先行 | Migration Step 1 | 固化边界与事实链路 | 分层边界、依赖方向规则、三层文档同步门禁、`integrations/ci` 骨架 | 文档同步检查可阻断；依赖方向检查可运行；CI 可稳定触发门禁命令 |
| Stage 1: 最小可用内核 | Phase A + 里程碑 1 | 可安装可初始化 | npm 包、CLI 命令骨架、`packages/config`、workspace 双模式 | 新仓库接入时间 < 15 分钟；`tool_managed` 默认生效；迁移支持回滚 |
| Stage 2: 最小治理闭环 | Phase A/B + 里程碑 2 | 跑通受控研发流程 | Process DSL + Compiler IR、Runtime、Memory/Session/Store 基线、标准阶段产物落盘 | 流程跳步受限；`Loop` 节点强制声明 `maxCycles/maxWallTimeSeconds`；重试/超时/取消可控；Memory 链路可稳定读写 |
| Stage 3: 策略与 HITL | Phase B | 效率与风险平衡 | 风险判定、策略门禁、人工回灌、通知分发、Standards Policy 基线 | 高风险动作必触发人工；策略决策可消费结构化规则；审计可追踪 |
| Stage 4: 规范与插槽体系 | Phase B/C + 里程碑 3 | 可扩展治理能力 | Standards Render/Project、Spec Sync Guard、Slot 双轨、升级 UX 闭环 | human/ai/agents 同源渲染一致；`AGENTS.md` 投影稳定；升级冲突与回滚可治理 |
| Stage 5: 多 Agent 与多工具适配 | Phase C + 里程碑 4 | 编排统一，执行开放 | Role Registry、Agent 契约、Adapter SDK、首批适配器、受限网络模式 | Codex/Copilot/Claude Code 在统一策略下可运行；Agent 契约已声明时间/Token/成本预算与降级路径；外网受限时本地治理仍可执行 |
| Stage 6: 审计、回放与依赖产物运行时 | Phase D + 里程碑 5 | 可观测、可解释、可恢复 | Audit、Report、Replay、Artifact Registry + Dependency Resolver、CLI 三模式、隐私治理 | `json` schema 稳定；非 TTY 自动降级 `plain`；Artifact Registry 主/归档分层与生命周期退出治理生效；依赖缺失与隐私保留可策略化处置 |
| Stage 7: 强化与发布治理 | Phase E + Migration Step 7 | 工程完成态 | 契约测试、集成/E2E、性能稳定性、发布策略（lockstep + independent） | 核心契约全通过；发布链路可 canary->rc->ga；回归可控 |
| Stage 8: 平台化扩展 | P2 平台化阶段 | 组织级能力扩展 | 插槽市场、可视化配置/执行面板、组织级审计与策略分发 | 不破坏本地主线，可按模块独立演进 |
| Stage 9: 投产就绪与落地运营 | Phase E 收口 + GA Readiness overlay | 让工具可被外部仓库真实安装、执行与运维 | 命令去 skeleton 化、无需发布的本地安装能力、发布产物可执行收敛、clean-room 安装验证、本地开发调试与诊断能力、AI 工具/模型全自动执行闭环、角色级进度日志与人类友好交互展示、用户文档与 examples、生产级 e2e 与 CI 发布流水线，并按 9A/9B 两段门槛推进 | 外部空环境安装后可执行 `init/doctor/check/run`；支持不经 npm 发布的本地安装与使用；关键命令不再返回 skeleton 占位输出；`release:ga-check` 覆盖 clean-room + 黑盒 e2e；本地调试可复现关键故障；多工具/多模型自动链路可稳定执行；人类可读地查看各角色执行进度/日志/交互状态；README/CHANGELOG 与 examples 可支撑接入 |

## 3.1 当前基线状态与投产差距（2026-03-24）

1. Stage 0-8 对应基线项目（`project-001` 到 `project-007`）与跨阶段流程优化项目（`project-008`）已完成“基线能力”落地，核心架构、契约与治理门禁链路已具备。
2. `project-009` 已完成 Stage 9 基线投产收口，证明“本地接入、最小治理执行、clean-room 验证、自动化/观测门禁”已经形成可复跑基础。
3. 当前剩余差距已经从“模块缺失”转为“全自动研发闭环尚未完全达标”，主要集中在六类：
   - 适配器真实调用仍未完全落地，当前多工具执行面仍存在 baseline stub。
   - `run` 仍以固定模板为主，尚未升级为任务驱动动态编排。
   - `review -> review-verify -> ledger backfill` 仍以异步产物队列和下游消费为主，未内联到自动主链。
   - HITL 的通知回执、人工决策回灌与恢复执行尚未形成稳定闭环。
   - 受控 delivery rehearsal 尚未形成统一可回放的一体化链路。
   - 黑盒 E2E、CI 与发布流水线对“真实无人值守路径”的覆盖仍不足。
4. 因此在 `project-009` 完成后继续以 `project-010` 承接 Stage 9 follow-up backlog，优先收敛“真实调用 + 动态编排 + HITL 闭环 + 可运营稳定性”。
5. `Stage 9` 是建立在 Stage 7/8 基线之上的投产收口 overlay，不单独新增 triad 正式技术 phase；在 triad 更新前统一按 `Phase E 收口 + GA Readiness overlay` 跟踪。

## 3.2 当前阶段状态矩阵（2026-03-24）

| 阶段/主线 | 对应项目 | 状态 | 关键证据 | 后续关注 |
|---|---|---|---|---|
| Stage 0-1 | `project-001-foundation` | completed | `project-001-completion-audit-summary.md` | 仅处理回归与局部补丁，不再扩张范围 |
| Stage 2-3 | `project-002-governance-core` | completed | `project-002-completion-audit-summary.md` | 后续仅随 Stage 9 真实执行链路暴露的问题做 fix-forward |
| Stage 4 | `project-003-standards-and-slots` | completed | `project-003-completion-audit-summary.md` | 关注 Standards/Slot 在真实用户路径中的投影一致性 |
| Stage 5 | `project-004-agent-adapter-runtime` | completed | `project-004-completion-audit-summary.md` | 需要在 Stage 9 补齐真实 provider 运维能力 |
| Stage 6 | `project-005-observability-and-artifacts` | completed | `project-005-completion-audit-summary.md` | 关注 audit/replay/CLI contract 在黑盒链路中的稳定性 |
| Stage 7 | `project-006-hardening-and-release` | completed | `project-006-hardening-and-release-completion-audit-summary.md` | 需要与 clean-room/黑盒 GA 门禁继续收敛 |
| Stage 8 | `project-007-platformization` | completed | `project-007-platformization-completion-audit-summary.md` | 作为 rollout 输入基线继续消费 |
| Cross-stage Workflow Optimization | `project-008-workflow-optimization` | completed | `project-008-workflow-optimization-completion-audit-summary.md` | 将执行流降噪、台账自动化经验前移到 Stage 9 |
| Stage 9 Baseline Production Readiness | `project-009-production-readiness` | completed | `project-009-completion-audit-summary.md` | 作为 follow-up 输入基线继续消费，不再回退已收口能力 |
| Stage 9 Follow-up Autonomous R&D Closure | `project-010-local-model-and-ide-expansion` | active | `project-010-local-model-and-ide-expansion/plan.md` | 收敛真实调用、动态编排、HITL 回灌、IDE/本地模型入口与可运营稳定性 |

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

1. 交付 DSL 与 Process Compiler，并定义 IR v1 契约（含 `Loop` 节点的 `maxCycles` / `maxWallTimeSeconds` 强制声明校验）。
2. 交付 Runtime：`Sequential/Parallel/Loop/Condition`。
3. 交付 `core-memory`、`core-session`、`memory-store-adapter` 契约，并落地 `memory-providers/fs-csv` 基线实现。
4. 实施标准阶段流转与跳步限制。
5. 按执行项目 + sprint 产出并回写：
   - `plan.md`
   - `tasks/checklist.md`（单列表 + 条目下执行记录）
   - `tasks/tasks.csv`（追加式执行台账）
   - `tasks/TK-xxx.md`
   - `review/review_*.md -> verified_*.md -> resolved_*.md`

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
2. 落地 Agent 协议与 capability matrix（至少覆盖 `error_contract`、`retry_policy`、`max_execution_time_seconds`、`token_budget`、`cost_budget`）。
3. 落地 Adapter SDK。
4. 交付首批 adapters：`codex`、`github-copilot`、`claude-code`。
5. 落地 routeKey 主备路由与降级回退。
6. 落地受限网络模式（Restricted Network Mode）：外部模型不可达时仍可执行本地规则检查、流程编排与台账回写，并预留本地模型接入路径。
7. 建立 `integrations/ide/` 骨架，统一多入口规范注入与命令包装约定。

## 4.7 Stage 6: 审计、回放与依赖产物运行时

1. 落地 Audit Recorder 最小字段与统一事件模型。
2. 落地 Report Builder + Replay/Explain。
3. 落地 Artifact Registry + Dependency Resolver（注册/解析/策略处置 + `active/frozen/deprecated/archived/retired` 生命周期退出治理；主注册表/归档注册表分层；非 `active/frozen` 默认不自动注入）。
4. 落地 CLI 输出契约：`pretty/plain/json` + `--output/--verbosity/--no-color`。
5. 完成非交互自动降级与错误输出结构化字段。
6. 落地 i18n 门禁（locale key parity + fallback 可用性检查），并把 `output_locale` 问题纳入回放定位。
7. 落地审计隐私治理：默认 90 天保留策略（可配置）、写入前敏感信息脱敏、按 `execution_id/project/sprint/date range` 导出与删除能力。
8. human-readable 产物视图若需要展示 Artifact Registry，统一从 machine-readable canonical source 渲染，不再手工维护镜像台账。

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

## 4.10 Stage 9: 投产就绪与落地运营

## 4.10.1 Stage 9 分阶段硬门槛

1. `Stage 9A: Local Adoption Readiness`
   - 映射：`project-009 / sprint-001-local-adoption-and-install-readiness`
   - 目标：先让外部仓库可本地安装、可只读接入、可诊断、可执行最小命令闭环。
   - Hard Exit:
     - `init`、`doctor`、`check` 已具备真实最小语义，不再返回 skeleton 占位输出。
     - 已提供“只读接入模式”，可检测现有规范/治理状态并输出接入建议，不强行改动目标仓库。
     - `tool_managed -> repo_local -> rollback` 至少完成 1 组 clean-room 切换验证，并确认 workspace 状态不丢失。
     - 至少两种本地安装模式通过 clean-room 连续 3 次验证；每次覆盖 `--help -> init -> doctor -> check`。
     - 根级 `examples/` 已存在并通过 example smoke，README/本地采用手册可支撑独立接入。
     - 已形成外部消费契约黑盒矩阵基线，至少覆盖 `runtime flags -> repo config -> defaults`、workspace 模式优先级、locale fallback 与 public package export / deep-import 边界。
     - 已形成最小支持矩阵并回链 clean-room 验证记录，至少声明 Node LTS 与 `macOS/Linux` 支持状态；若某平台暂不支持，必须显式记录限制与原因。
     - 形成 `DA-092` 作为 Stage 9B 唯一入口约束。
2. `Stage 9B: Automation + GA Operations`
   - 映射：`project-009 / sprint-002-automation-observability-and-ga-rollout`
   - Entry Gate:
     - `DA-092` 已完成并可回链。
     - 9A 的本地安装、只读接入、workspace 切换回滚、`examples/` / 文档、外部消费契约矩阵与支持矩阵基线保持可复跑。
   - Hard Exit:
     - 至少 1 条 `plan -> run -> review -> review-verify -> report -> ledger backfill` 无人值守链路连续通过 rehearsal。
     - 至少 1 条受控 delivery rehearsal 覆盖 `commit` 或 `PR draft`；若当前阶段不开放自动推送/发 PR，必须显式记录边界与人工接管条件。
     - 角色级进度展示、关键日志与 HITL 交互提示已与 audit/replay 对齐。
     - 至少 1 主 1 备 HITL 通知渠道的 `confirm/escalate` 演练通过，通知回执与人工决策回灌可在 audit/replay 中回链。
     - 黑盒 E2E、CI 与发布流水线已覆盖真实用户路径。
     - 试点仓库反馈、30 天运营闭环与运营指标快照已沉淀为后续输入约束。

## 4.10.2 Stage 9 交付清单

1. CLI 命令去 skeleton 化（优先级 P0）
   - `init`：真正完成 workspace 初始化、配置生成/更新与最小目录落盘。
   - `doctor`：提供可执行环境诊断、配置校验、只读接入预检与下一步建议，不仅输出占位提示。
   - `check`：输出可消费的治理结果与失败诊断，不仅是命令占位反馈。
   - `run`：接入 `compiler -> runtime -> policy -> audit/report` 最小闭环。
   - `review/review-verify/plan/upgrade`：至少完成“可执行最小语义”与错误处理契约。
   - 既有规范检测与复用建议：首次接入时能识别已有规范入口、给出 read-only 建议并避免重复建设。
   - 兼容迁移策略：`json` 输出字段默认只允许增量扩展；若存在 breaking change，必须提供 deprecation window、兼容模式或显式迁移说明，并补充 before/after 示例输出。
2. 本地开发调试与诊断能力（优先级 P0/P1）
   - 提供本地调试模式：支持 `dry-run/trace/replay` 等可复现执行路径，便于快速定位失败节点。
   - 提供开发诊断输出：阶段耗时、策略判定依据、adapter 调用摘要、错误上下文字段统一可读。
   - 提供本地最小联调夹具：示例配置、示例流程、mock/provider 切换能力，支持无外部依赖自测。
   - 建立“问题复现 -> 定位 -> 修复验证”标准手册并接入贡献流程。
3. 无需发布的本地安装与使用能力（优先级 P0）
   - 提供本地安装路径：支持从本地源码目录、`pnpm pack` 产物（`.tgz`）或 link 方式安装并调用 CLI。
   - 提供本地安装验证脚本：在 clean-room 临时目录完成“安装 -> `--help` -> `init/check/run`”最小链路验证。
   - 本地安装验证需覆盖至少 1 组 `tool_managed -> repo_local -> rollback` workspace 切换与状态保全验证。
   - 明确“本地安装模式”与“正式发布模式”的差异、限制与推荐场景。
   - 输出外部消费契约黑盒矩阵：覆盖 `runtime flags -> repo config -> defaults`、workspace/i18n precedence、public package exports 与 deep-import 禁止边界。
   - 发布最小支持矩阵：至少声明 Node LTS 与 `macOS/Linux` 支持状态（可附 Windows 状态），并把 clean-room 结果回链到安装验证记录。
4. 发布产物可执行性收敛（优先级 P0）
   - 明确发布形态：单包 bundle 或多包发布（禁止产物依赖未发布的 workspace 包名）。
   - 增加 clean-room 分发验证：临时目录安装 tarball 后执行 CLI 关键命令 smoke。
   - 将 clean-room 验证纳入 `release:check` / `release:ga-check` 必经门禁。
5. AI 工具/模型接入与全自动执行闭环（优先级 P0/P1）
   - 完成 `codex/github-copilot/claude-code` 适配器从“基线契约”到“真实调用”收敛，支持凭据与能力探测。
   - 建立多模型路由策略：按 `role/capability/cost/latency/risk` 进行主备与降级切换。
   - 打通端到端自动执行链路：`plan -> run -> review -> review-verify -> report -> ledger backfill` 在无人值守模式可执行（命中策略闸口时按规则暂停）。
   - 增加受控 delivery rehearsal：在策略允许场景至少覆盖 `commit` 或 `PR draft` 的演练；若自动推送/发 PR 暂不开放，必须显式记录边界与人工接管条件。
   - 增加自动化执行稳定性门禁：覆盖限流、超时、重试、fallback 与受限网络场景。
   - 增加适配器投产验收：`credential source precedence`、`probe/health report`、`rate-limit/backoff`、`secret redaction`、`provider outage degrade path` 必须有明确契约与验证路径。
6. 角色级进度日志与人类友好交互展示（优先级 P0/P1）
   - 提供角色视角执行进度：按 `role/stage/status` 展示运行中、等待中、已完成、失败、人工确认中等状态。
   - 提供可读日志分层：默认展示摘要与关键事件，支持展开详细日志与错误上下文，避免信息噪音淹没人类决策。
   - 提供关键交互提示：在 HITL、权限确认、失败重试等节点给出明确下一步建议与可执行动作。
   - 统一输出契约：`pretty/plain` 人类可读优先，`json` 保持稳定字段（含 role 维度进度与事件关联字段）供 IDE/CI 消费。
   - 将角色进度与交互轨迹回链至 audit/replay，确保“终端展示”与“审计事实”一致。
   - 至少完成 1 主 1 备 HITL 通知渠道的 `confirm/escalate` 演练，并将通知回执回链至 audit/replay。
7. 用户接入与运维文档（优先级 P0/P1）
   - 补齐 `README.md` / `README.zh-CN.md`：5~15 分钟接入路径、配置示例、常见命令。
   - 补齐 `CHANGELOG.md` / `CHANGELOG.zh-CN.md`：可追踪版本差异与升级注意事项。
   - 提供最小示例资产（示例 `governor.yaml`、示例流程定义、故障排查手册）。
8. Examples 资产与示例可执行性（优先级 P0/P1）
   - 建立根级 `examples/` 并纳入发布文件清单，提供最小可运行示例。
   - 示例至少覆盖：单角色最小流程、多角色协作流程、HITL 触发流程、受限网络降级流程。
   - 每个示例提供输入、执行命令、预期输出与常见失败排查说明。
   - 将 example smoke 纳入门禁，避免示例与主实现漂移。
9. 黑盒 E2E 与回归门禁升级（优先级 P1）
   - 新增“外部用户路径”黑盒测试：`只读接入 -> init -> doctor -> check`、`plan -> run -> review -> review-verify -> report/replay`。
   - 对关键测试入口收紧 `passWithNoTests` 依赖，避免“无测试通过”的假阳性。
   - 为高风险发布路径增加稳定性回归（受限网络、回滚、依赖缺失、配置不兼容）。
10. CI 与发布流水线生产化（优先级 P1）
   - 将 `integrations/ci/github-actions/quality-gate.yml` 落地到真实 `.github/workflows/`。
   - 补齐发布流水线（candidate -> rc -> ga）的自动化接线与失败回滚信号。
   - 增加供应链与安全基线（依赖审计、许可证检查、可选 SBOM）并纳入 release gate。
11. 试点落地与运营反馈（优先级 P1/P2）
   - 选择 1~2 个真实目标仓库做接入试点，记录接入耗时、失败率与人工介入点。
   - 建立“投产后 30 天”问题闭环：缺陷分级、SLO 指标、修复节奏与版本策略。
   - 形成运营指标快照：接入耗时、规范违规率、自动执行成功率、回滚率、人工介入率，并作为 GA readiness 与后续 triad 输入。
   - 将试点反馈回写 triad 文档与 master plan，形成下一轮产品迭代输入。

## 4.10.3 Stage 9 全自动研发 Gap Register（2026-03-24）

1. 本计划中的“全自动研发”不等于“所有变更默认零人工介入”；其正式定义是“在治理约束下尽可能无人值守推进，命中高风险或策略闸口时按规则暂停并可恢复执行”。
2. 作为 Stage 9B 与后续 follow-up 的统一问题清单，当前必须继续收敛以下 6 类 gap：

| gap_id | 差距项 | 当前信号 | 完成判据 | 建议落点 |
|---|---|---|---|---|
| G-01 | 真实适配器执行面未闭环 | `codex/github-copilot/claude-code/local-model` 仍以 baseline stub 为主，`invokeStage()` 尚未全面进入真实 provider 调用 | 至少 1 条远端 provider 路径和 1 条本地模型路径具备真实调用，并补齐凭据优先级、health/probe、timeout/retry、rate-limit/backoff、secret redaction、provider outage degrade path | `TK-096`、`TK-097` |
| G-02 | `run` 仍是固定模板而非任务驱动编排 | 当前仍以 `prepare -> execute -> report` 三段模板为主，尚未从任务目标动态装配研发流程 | `run` 支持从任务目标/依赖产物/role-capability 约束生成或装配可执行 DAG，并可消费 policy route/fallback 约束 | `TK-098` + sprint-002 follow-up |
| G-03 | Review 链路未内联到自动主链 | `review -> review-verify -> ledger backfill` 仍以 queued artifact 与下游消费为主 | review chain 可作为 `run` 的受控子链自动推进，并保持 artifact/audit 语义一致 | `TK-098` + sprint-002 follow-up |
| G-04 | HITL 回执与决策回灌未闭环 | 命中 `confirm/escalate` 后仍主要停在人工等待，缺少统一回执回链与恢复执行 | 至少 1 主 1 备通知渠道接通，人工决策可回灌到 runtime/policy，并触发继续执行、终止或降级 | `TK-098` + sprint-002 follow-up |
| G-05 | 受控 delivery rehearsal 尚未一体化 | `commit` / `PR draft` 仍未与自动主链形成统一回放、统一治理、统一审计的交付演练 | 至少 1 条受控 delivery rehearsal 覆盖 `commit` 或 `PR draft`，并明确人工接管边界 | sprint-002 follow-up / Stage 9B closure |
| G-06 | 稳定性与黑盒门禁尚未覆盖真实无人值守路径 | 真实用户路径、provider outage、restricted network、retry exhaustion 等场景仍缺乏稳定黑盒验证 | 黑盒 E2E、CI、release gate 覆盖主路径与降级路径，并沉淀成功率/人工介入率/time-to-first-success 等运营指标 | `TK-097` + sprint-002 follow-up |

3. 收敛顺序必须遵循：
   - 先闭环 `G-01`，否则所有“自动执行”都只停留在协议演示层。
   - 再闭环 `G-02/G-03`，把 `run` 升级为真正的任务驱动链路并内联 review chain。
   - 然后闭环 `G-04`，把 HITL 从“人工中断点”升级为“可恢复执行点”。
   - 最后用 `G-05/G-06` 做交付演练与可运营稳定性收口。
4. `project-010` 是上述 gap register 的当前主承接项目；后续 task/sprint 拆解必须回链到本节，不得重新发明一套并行问题清单。

## 4.11 已识别但暂不纳入 project-009 出口门槛的 P1 follow-up backlog

1. 编程语言模板扩展
   - 从当前 TypeScript/JavaScript 基线扩展到 Python、Go、Java、Rust 等治理模板与检查链路。
2. 更多官方 CI 模板
   - 在 GitHub Actions 之外补齐 GitLab CI 与 Jenkins 官方模板。
3. 本地模型适配路径
   - 为受限网络场景补齐 Ollama 类本地推理入口的官方 adapter baseline。
4. 处理规则
   - 以上能力保持在 `P1 进行中`，作为 `project-009` 之后的 follow-up backlog；除非试点反馈将其升级为外部落地阻断，否则不作为 Stage 9A/9B Hard Exit。

## 5. 并行治理主线（每阶段都必须执行）

1. 文档事实链路主线
   - 三层文档与 brief 同步门禁常开。
2. 规范加载清单主线
   - `normative-loading-manifest` gate 常开，active 规范文档必须完成登记且默认 blocking。
3. 质量门禁主线
   - 本地与 CI 使用同一验证命令与退出码语义；测试执行基线统一为 `Vitest`，格式化与 lint 基线统一为 `Biome`。
4. 安全权限主线
   - 默认最小权限，所有高风险动作统一走风险判定与 HITL。
5. 多语言主线
   - 中文/英文输出能力并行建设，统一 locale 解析与 fallback 策略，机器字段保持稳定。
6. workspace 生命周期主线
   - 默认 `tool_managed`，支持 `repo_local`，切换可回滚。
7. 受限网络主线
   - 外部模型不可达时，治理门禁、流程状态机与台账写入仍可独立运行。
8. 依赖产物生命周期主线
   - Artifact Registry 持续维持主注册表/归档注册表分层、`deprecated` 宽限归档与自动注入边界。
9. 评审生命周期主线
   - code review 文件名状态与文档 `Status` 元数据同步门禁常开，避免 review 产物状态漂移。
10. 投产可用性主线
   - 每次 GA 候选必须通过 clean-room 安装与黑盒命令链路验证，禁止仅凭仓库内 smoke 判定可发布。

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
8. `project-008-workflow-optimization`
   - 覆盖跨阶段执行流优化与交付降噪（台账自动化、低噪音门禁、默认工作流收敛）。
9. `project-009-production-readiness`
   - 覆盖 Stage 9（命令去 skeleton 化、本地调试能力、AI 工具/模型全自动执行闭环、角色级进度日志与交互展示、发布可执行性收敛、文档与 E2E/CI 生产化）。

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
8. 在 clean-room 环境中，安装发布包后可直接执行 CLI 入口且无内部包缺失错误。
9. 关键用户路径（只读接入、`init/doctor/check/run/review/review-verify`）具备真实执行语义，不再返回 skeleton 占位结果。
10. 工具用户文档与升级说明可独立指导接入、排障与版本升级。
11. 本地开发者可在无生产依赖前提下复现并定位关键问题（包含 trace/replay 与诊断字段）。
12. 至少一条多工具/多模型自动执行链路在无人值守模式可稳定跑通，并覆盖 `review-verify` 与台账回写，且具备策略闸口接管语义。
13. 不经 npm 发布也可完成本地安装并稳定使用（至少覆盖 path/tgz/link 中两种方式）。
14. examples 目录提供可执行示例，并通过 example smoke 门禁验证。
15. 在多角色执行过程中，人类可实时查看角色级进度、关键日志与交互状态，并可基于提示完成必要人工决策。
16. 只读接入模式与 `tool_managed <-> repo_local` workspace 切换/rollback 已在 clean-room 外部仓库路径完成验证。
17. 外部消费契约黑盒矩阵已验证，覆盖配置优先级、workspace/i18n precedence 与 public export 边界。
18. 至少 1 主 1 备 HITL 通知渠道的 `confirm/escalate` 演练通过，通知回执可在 audit/replay 中回链。
19. 至少 1 条受控 delivery rehearsal 覆盖 `commit` 或 `PR draft`，并明确自动推送/发 PR 的当前边界。
20. 已发布最小支持矩阵并回链 clean-room 验证结果，至少覆盖 Node LTS 与 `macOS/Linux`。
21. 试点与 30 天运营闭环已形成可统计的运营指标快照（接入耗时、规范违规率、自动执行成功率、回滚率、人工介入率）。

## 8.1 GA Readiness 量化信号（最小）

1. 至少 2 个试点仓库完成 `install -> init -> doctor -> check` 首次成功路径，且单仓库接入耗时不超过 15 分钟。
2. 选定的两种本地安装模式在 clean-room 环境下各连续 3 次通过；每次至少覆盖 `--help -> init -> doctor -> check`。
3. GA 候选的黑盒用户路径矩阵 `init -> doctor -> check -> run -> report/replay` 必须 100% 通过。
4. 至少 1 条 `plan -> run -> review -> review-verify -> report -> ledger backfill` 无人值守链路连续 3 次 rehearsal 通过；若中断，原因必须归类为策略/HITL，而非未归因运行时失败。
5. 试点期的人工介入与失败事件必须全部具备结构化归因（环境前置/策略闸口/权限确认/运行时缺陷），禁止存在未分类 blocker。
6. 至少 1 个试点仓库验证“只读接入模式不写入目标仓库”，且至少 1 组 `tool_managed -> repo_local -> rollback` workspace 切换路径在 clean-room 环境通过。
7. 至少 1 组外部消费契约黑盒矩阵通过，覆盖 `runtime flags -> repo config -> defaults`、workspace/i18n precedence 与 public export / deep-import 边界。
8. 至少 1 主 1 备 HITL 通知渠道的 `confirm/escalate` rehearsal 通过，且通知回执能在 audit/replay 中回链。
9. 至少 1 条受控 delivery rehearsal 覆盖 `commit` 或 `PR draft`，并显式记录自动推送/发 PR 的开放边界。
10. 已声明最小支持矩阵（至少 Node LTS 与 `macOS/Linux` 支持状态），并完成矩阵内 clean-room smoke 记录。
11. 试点期需产出运营指标快照：接入耗时、规范违规率、自动执行成功率、回滚率、人工介入率。

## 9. 执行与维护规则

1. 若需求变化触及边界或原则，先更新本计划，再推进实现。
2. 若 PRD/总技术方案/架构蓝图发生语义变更，本计划需在同一变更集中同步。
3. 本计划用于指导 project/sprint/task 拆解，不替代阶段性执行记录文档。
4. 若“工程门禁通过”与“外部可执行性验证”结果冲突，以外部可执行性为准阻断发布。
