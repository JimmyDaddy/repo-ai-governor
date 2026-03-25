# Repo AI Governor 从零到完成态总执行计划

- Status: active
- Date: 2026-03-25
- Role: execution master plan
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. 文档定位

1. 本文件是工具级执行总纲，用来回答四件事：
   - 我们已经完成到哪里；
   - 当前真正卡在哪里；
   - 下一阶段应该先做什么；
   - 后续 `project/sprint/task` 应如何拆解。
2. 本文件不替代 triad 文档：
   - 产品目标以 PRD/brief 为准；
   - 架构边界以总技术方案和架构蓝图为准；
   - 本文件负责把这些上游约束落成可执行路线图。
3. 若后续实现与本计划出现长期偏差，应先修订本计划，再继续扩张任务面。

## 2. 使用方式

1. 读本文件时，优先看：
   - `§3 当前执行摘要`
   - `§4 路线图总览`
   - `§6 Stage 9 投产与自治收口主线`
2. 需要拆 project 时，使用：
   - `§8 Project 映射`
   - `§9 Sprint/Task 模板`
3. 需要判断工具是否接近完成态时，使用：
   - `§10 工具级完成态与 GA 指标`
4. 在 triad 尚未引入新的正式 phase 前，所有投产类收口工作统一跟踪为：
   - `Phase E 收口 + GA Readiness overlay`

## 3. 当前执行摘要（2026-03-25）

## 3.1 一句话结论

1. Stage 0-9 的业务闭环能力已经完成，`project-013` 也已补齐远端 provider 真实调用与 adapter 运维契约；当前主线是 `project-014`，且 sprint-002 已完成 LangGraph Phase 0 backend、checkpoint/recovery 与 shared local orchestration service shell 的第一轮正式实现，下一步进入 sprint-003 的 service-backed execution 扩围。

## 3.2 当前真实状态

1. 已完成的部分：
   - 核心架构、流程编排、策略门禁、审计回放、Artifact Registry、发布治理、平台化骨架已经具备。
   - 本地接入、clean-room 安装验证、最小治理执行、adapter 探测与外部消费契约基线已经具备。
   - `run` 已升级为任务驱动 DAG，`review -> review-verify -> ledger backfill`、HITL `resume/terminate/degrade`、delivery rehearsal、Stage 9 GA blackbox 和多 IDE 官方入口都已形成完成态证据。
   - `project-013` 已完成 Codex / GitHub Copilot / Claude Code 的远端 provider 真实调用、adapter 运维契约与 route-runner truthfulness 收口，Stage 9 最后业务阻断已关闭。
2. 当前未完成的部分：
   - `LangGraph` Phase 0 backend、最小主链、checkpoint/recovery 与 in-process shared local orchestration service shell 已经落地，但还没有完成 service-backed execution 扩围与进程外形态收敛。
   - CLI 与未来桌面端的共用执行面已经有统一 contract 和 in-process shell，但还没有形成独立 transport / daemon-ready / desktop-ready 的正式执行 API。
   - 因此“graph-first runtime 完成 cutover + 多执行表面共用稳定 service contract”这条工程演进主线仍未关闭。

## 3.3 当前主执行流

| 角色 | 对应项目 | 状态 | 作用 |
|---|---|---|---|
| 已完成基线 | `project-001` ~ `project-008` | completed | 提供架构、运行时、治理、审计、发布与平台化基线 |
| 投产基线完成态 | `project-009-production-readiness` | completed | 证明工具已具备本地可采用、可诊断、可 clean-room 验证的外部可用基础 |
| 已完成 Stage 9 主链收口 | `project-010-local-model-and-ide-expansion` | completed | 已完成本地模型、自动主链、HITL、delivery、GA 与 IDE official surface 收口 |
| 当前工程支撑主线 | `project-011-cli-package-decomposition` | completed | 已完成 CLI package God object 拆解与正式 handoff，为后续 provider 执行面改造提供稳定工程边界 |
| 当前治理支撑主线 | `project-012-execution-context-optimization` | completed | 已完成 startup/context/task-ledger/review-chain 优化并形成正式 handoff |
| 已完成 Stage 9 最后业务阻断收口 | `project-013-remote-provider-and-adapter-ops` | completed | 已完成远端 provider 真实调用、adapter 运维契约与统一路由 truthfulness 收口 |
| 当前架构演进主线 | `project-014-langgraph-orchestration-runtime-adoption` | active | 采用 LangGraph 作为编排运行时方向，并收敛 shared local orchestration service 以同时服务 CLI 与未来桌面端 |

## 3.4 当前推荐执行顺序

1. 已将 `project-013` 视为 completed handoff，后续只消费其远端 provider 执行面与 adapter ops 产物。
2. `project-014 / sprint-001` 已完成 adoption baseline、runtime/service boundary 与 cutover 输入约束冻结。
3. `project-014 / sprint-002` 已通过 `DA-152` 完成出口验收，第一轮 LangGraph backend、checkpoint/recovery 与 service shell 实装已收口。
4. 下一步拆解并启动 `project-014 / sprint-003`，继续扩大 shared local orchestration service 的 service-backed execution、transport 与 desktop-ready contract。

## 4. 路线图总览

| 阶段 | 对齐映射 | 当前判断 | 核心产出 | 退出门槛 |
|---|---|---|---|---|
| Stage 0 | Migration Step 1 | completed | 边界、事实链路、CI 骨架 | 文档同步与依赖方向检查可阻断 |
| Stage 1 | Phase A + Milestone 1 | completed | CLI 入口、配置、workspace 双模式 | 新仓库可在 15 分钟内完成最小接入 |
| Stage 2 | Phase A/B + Milestone 2 | completed | DSL、Compiler、Runtime、Memory/Session 基线 | 受控流程和阶段产物稳定落盘 |
| Stage 3 | Phase B | completed | 风险判定、策略门禁、HITL、通知 | 高风险动作可解释且可人工接管 |
| Stage 4 | Phase B/C + Milestone 3 | completed | Standards、Spec Sync、Slots、安全模型 | human/ai/agents 投影同源 |
| Stage 5 | Phase C + Milestone 4 | completed | Role Registry、Adapter SDK、首批适配器 | 多工具可在统一治理下运行 |
| Stage 6 | Phase D + Milestone 5 | completed | Audit/Report/Replay、Artifact Registry、CLI contract | 可观测、可解释、可恢复 |
| Stage 7 | Phase E + Migration Step 7 | completed | 契约测试、集成/E2E、发布治理 | 核心质量与回滚基线稳定 |
| Stage 8 | P2 平台化阶段 | completed baseline | 平台化扩展骨架 | 不破坏本地主线，可按模块独立演进 |
| Stage 9 | Phase E 收口 + GA Readiness overlay | completed | 投产基线 + 自治闭环收口 | 外部可采用、可运维、可受控无人值守推进 |
| Post-Stage-9 | Phase E Follow-Up Runtime Modernization | active | LangGraph backend + local orchestration service | CLI 与未来 desktop 共用 runtime/service，且 LangGraph cutover parity 验证成立 |

## 5. 阶段资产与完成态

## 5.1 Stage 0-2：从空仓库到最小治理闭环

1. 必须具备：
   - Monorepo 分层与依赖方向基线
   - CLI / Config / Workspace 根解析
   - DSL / Compiler IR / Runtime
   - Memory / Session / Store provider 基线
   - 计划、任务、review 生命周期落盘规范
2. 当前判断：
   - 这些阶段已经完成，不再作为主阻断。
3. 后续只做：
   - fix-forward
   - 契约兼容修补
   - 被 Stage 9 真实用户路径反向暴露出来的问题治理

## 5.2 Stage 3-5：策略、规范与多工具执行开放

1. 必须具备：
   - 风险评估与 `allow/confirm/block/escalate`
   - HITL 字段与通知分发
   - Standards Pack / Slot 安全模型
   - Role Registry / Adapter SDK / 首批 adapters
   - Restricted Network Mode 基线
2. 当前判断：
   - 这些基线已经形成，但“真实 provider 调用”和“可运营适配器行为”仍需在 Stage 9 follow-up 补强。

## 5.3 Stage 6-8：可观测、发布与平台化骨架

1. 必须具备：
   - Audit / Report / Replay
   - Artifact Registry / Dependency Resolver
   - CLI `pretty/plain/json` 契约
   - 契约测试 / 集成测试 / 发布治理
   - 平台化骨架但不反客为主
2. 当前判断：
   - 这些基线已经存在，当前问题已不在“有没有这些模块”，而在“它们是否覆盖真实无人值守主链”。

## 6. Stage 9 投产与自治收口主线

## 6.1 Stage 9 的定义

1. Stage 9 不是新架构层，而是对 Stage 0-8 的投产收口 overlay。
2. Stage 9 解决的不是“功能是否存在”，而是：
   - 外部仓库能不能真实采用；
   - 命令是否有真实语义；
   - 自动执行是否能打通到可运营程度；
   - 黑盒验证与运营指标是否足够支持 GA。

## 6.2 已交付的投产基线

1. `project-009` 已完成的内容：
   - `init/doctor/check` 最小真实语义
   - clean-room 本地安装与 workspace 切换验证
   - 外部消费契约矩阵与支持矩阵基线
   - 多工具探测、诊断、最小 route surface
   - 角色级进度输出与交互展示基线
   - 黑盒/CI/release gate 的第一轮 productionization
2. 这意味着：
   - 工具已经不是“只能在本仓库里跑”的原型；
   - 但也还不是“真正默认可无人值守完成研发交付”的自治研发器。

## 6.3 Stage 9 正式 Gap Register

1. 本计划中的“全自动研发”不等于“所有变更默认零人工介入”。
2. 这里的正式定义是：
   - 在治理约束下尽可能无人值守推进；
   - 命中高风险或策略闸口时按规则暂停；
   - 通知、人工决策、恢复执行、审计回链必须是同一链路的一部分。

| gap_id | 差距项 | 当前信号 | 完成判据 | 当前承接 |
|---|---|---|---|---|
| G-01 | 真实适配器执行面未闭环 | 已由 `project-013 / sprint-001` 收口，Codex / GitHub Copilot / Claude Code 均已具备真实 provider 执行面 | 至少 1 条远端 provider 路径和 1 条本地模型路径具备真实调用，并补齐凭据、health、timeout/retry、限流、脱敏、degrade path 契约 | completed by `project-013 / sprint-001` |
| G-02 | `run` 仍是固定模板 | 当前仍主要是 `prepare -> execute -> report` 三段模板 | `run` 能按任务目标、依赖产物、角色能力动态装配可执行 DAG | `TK-098` 已完成；sprint-002 |
| G-03 | Review 链路未内联到自动主链 | `review -> review-verify -> ledger backfill` 仍以 queued artifact 与下游消费为主 | review chain 可作为自动主链受控子链推进，并与审计事实保持一致 | `TK-098` 已完成；sprint-002 |
| G-04 | HITL 回执与决策回灌未闭环 | 命中 `confirm/escalate` 后仍主要停在人工等待 | 至少 1 主 1 备通知渠道接通，人工决策可回灌并触发继续执行/终止/降级 | `TK-098` 已完成；sprint-002 |
| G-05 | 受控 delivery rehearsal 未一体化 | `commit` / `PR draft` 仍未与自动主链形成统一回放与审计 | 至少 1 条受控 delivery rehearsal 覆盖 `commit` 或 `PR draft`，并记录人工接管边界 | sprint-002 / Stage 9 closure |
| G-06 | 稳定性与黑盒门禁未覆盖真实无人值守路径 | provider outage、restricted network、retry exhaustion 等场景仍缺稳定黑盒验证 | 黑盒 E2E、CI、release gate 覆盖主路径与降级路径，并沉淀成功率/人工介入率等运营指标 | `TK-097` + sprint-002 |
| G-07 | 编排运行时尚未收敛到 graph-first shared runtime | LangGraph Phase 0 backend、checkpoint/recovery 与 in-process service shell 已落地，但 service-backed execution 与 desktop-ready API 仍未完成 | `LangGraph` backend、短期 cutover parity 验证、local orchestration service 与 CLI/desktop 共享执行 API 形成正式基线 | `project-014 / sprint-002` completed, sprint-003 next |

## 6.4 Stage 9 收敛顺序

1. 先闭环 `G-01`。
   - 否则后续所有“自动执行”都只是协议演示层。
2. 再闭环 `G-02/G-03`。
   - 把 `run` 升级为真正的任务驱动链路，并把 review chain 内联进去。
3. 再闭环 `G-04`。
   - 把 HITL 从“人工中断点”升级为“可恢复执行点”。
4. 最后用 `G-05/G-06` 做交付演练与可运营稳定性收口。
5. 在 Stage 9 业务闭环完成后，继续收敛 `G-07`。
   - 把编排内核升级为 graph-first runtime，并把 CLI/desktop 执行面统一到 shared local orchestration service。

## 6.5 Stage 9 当前执行队列

1. 已完成 Stage 9 follow-up：
   - `TK-096`：真实调用与 route fallback
   - `TK-097`：deep probe、restricted network、稳定性门禁
   - `TK-098`：sprint-001 出口验收与 sprint-002 输入约束
   - `TK-099`：任务驱动 DAG 与 `run` 主链装配
   - `TK-100`：`review -> review-verify -> ledger backfill` 内联收口
   - `TK-101`：HITL 决策回执与 `resume/terminate/degrade`
   - `TK-102`：sprint-002 出口验收与 sprint-003 输入约束
   - `TK-107`：受控 delivery rehearsal 与 audit/replay 接线
   - `TK-108`：黑盒/CI/release/GA 指标收口
   - `TK-109` ~ `TK-111`：多 IDE 官方入口 productionization
   - `TK-112`：project-010 出口验收与 rollout 输入约束
   - `TK-135`：standards injection source ID 与 resolver 收口
2. parallel enabling track（completed）：
   - `project-011 / TK-115`：project 拆分与依赖重排
   - `project-011 / TK-116`：adapter verification 与 local probe 抽离
   - `project-011 / TK-117`：route fallback 与 diagnostics builder 抽离
   - `project-011 / TK-118`：sprint-001 出口验收与 sprint-002 输入约束
3. 已完成 Stage 9 最后业务阻断收口（project-013 / sprint-001）：
   - `TK-136`：project-013 启动与远端 provider 收口重排
   - `TK-137`：Codex 远端 provider 真实调用与凭据/health 契约
   - `TK-138`：GitHub Copilot 远端 provider 真实调用与 capability truthfulness 收口
   - `TK-139`：Claude Code 远端 provider 真实调用与 fallback/degrade 收口
   - `TK-140`：跨 provider adapter 运维契约与 route-runner truthfulness hardening
   - `TK-141`：sprint-001 出口验收与后续 rollout 输入约束
4. 已完成的 adoption baseline 队列（project-014 / sprint-001）：
   - `TK-142`：LangGraph 采用决策并入 triad/master plan 与 project-014 启动
   - `TK-143`：Process Runtime -> LangGraph adapter 边界与 state contract 基线
   - `TK-144`：shared local orchestration service（CLI + desktop）契约基线
   - `TK-145`：LangGraph Phase 0 spike、cutover parity 验证与 rollout 迁移计划
   - `TK-146`：sprint-001 出口验收与 sprint-002 输入约束
5. 已完成的 Phase 0 实装队列（project-014 / sprint-002）：
   - `TK-147`：core-runtime-langgraph backend skeleton 与 compiled IR graph adapter 基线
   - `TK-148`：Process Runtime facade backend selector 与 cutover parity harness 基线
   - `TK-149`：file-backed checkpointer 与 recovery smoke 基线
   - `TK-150`：LangGraph `run/review/HITL` 最小主链接线
   - `TK-151`：`sqlite-fs` checkpointer 与 shared local orchestration service shell 收敛
   - `TK-152`：sprint-002 出口验收与 sprint-003 输入约束
6. 下一步执行队列：
   - 拆解并启动 `project-014 / sprint-003`
   - 扩大 service-backed execution、desktop-ready transport 与 cutover 扩围验证

## 7. 并行治理主线

1. 文档事实链路主线
   - triad + brief 同步门禁常开。
2. 规范加载清单主线
   - `normative-loading-manifest` 默认 blocking。
3. 质量门禁主线
   - 本地与 CI 使用同一退出码和验证语义。
4. 安全权限主线
   - 默认最小权限，高风险动作统一走风险判定与 HITL。
5. 多语言主线
   - 中文/英文并行建设，机器字段保持稳定。
6. workspace 生命周期主线
   - 默认 `tool_managed`，支持 `repo_local`，切换可 rollback。
7. 受限网络主线
   - 外部模型不可达时，治理门禁、流程状态机与台账仍可单独运行。
8. 依赖产物生命周期主线
   - Artifact Registry 维持主/归档分层与自动注入边界。
9. 评审生命周期主线
   - review 文件名状态与 `Status` 元数据同步门禁常开。
10. 投产可用性主线
   - 每次 GA 候选必须通过 clean-room 安装与黑盒链路验证。

## 8. Project 映射

| project | 覆盖范围 | 当前状态 | 说明 |
|---|---|---|---|
| `project-001-foundation` | Stage 0-1 | completed | 基础边界、配置、workspace、CLI 起点 |
| `project-002-governance-core` | Stage 2-3 | completed | 流程编排、策略门禁、HITL、通知 |
| `project-003-standards-and-slots` | Stage 4 | completed | Standards、投影、Slots、安全模型 |
| `project-004-agent-adapter-runtime` | Stage 5 | completed | 角色模型、Adapter SDK、首批 adapters |
| `project-005-observability-and-artifacts` | Stage 6 | completed | Audit、Replay、Artifact Registry、CLI contract |
| `project-006-hardening-and-release` | Stage 7 | completed | 契约测试、稳定性、发布治理 |
| `project-007-platformization` | Stage 8 | completed | P2 平台化骨架 |
| `project-008-workflow-optimization` | Cross-stage | completed | 执行流降噪、台账自动化、工作流优化 |
| `project-009-production-readiness` | Stage 9 baseline | completed | 投产基线、clean-room、外部采用、production gate baseline |
| `project-010-local-model-and-ide-expansion` | Stage 9 follow-up | completed | 已完成本地模型、自动主链、HITL、delivery、GA 与 IDE official surface 收口 |
| `project-011-cli-package-decomposition` | Stage 9 enabling refactor | completed | 已完成 CLI package God object 拆解，并为 `project-010` 主链升级提供正式 handoff 边界 |
| `project-012-execution-context-optimization` | Cross-stage follow-up | completed | 已完成 startup/context/task-ledger/review-chain 与 selective memory 注入的治理收口 |
| `project-013-remote-provider-and-adapter-ops` | Stage 9 remaining closure | completed | 已完成远端 provider 真实调用、adapter 运维契约与统一路由 truthfulness 收口 |
| `project-014-langgraph-orchestration-runtime-adoption` | Post-Stage-9 runtime modernization | active | 采用 LangGraph 作为编排运行时方向，收敛 LangGraph cutover 验证与 shared local orchestration service，统一 CLI 与未来 desktop 的执行面 |

## 9. Sprint 与 Task 最小模板

## 9.1 Sprint 模板

1. `sprint goal`
   - 单一、可验证、不可拆歧义。
2. `scope`
   - 只覆盖同阶段问题，不跨阶段硬并行。
3. `entry criteria`
   - 前置阶段门槛已满足。
4. `exit criteria`
   - 功能完成 + 审计可追踪 + 文档同步 + CI 通过。
5. `risk list`
   - 高风险路径、权限动作、人工闸口、回滚边界。

## 9.2 Task 模板

1. 最小字段：
   - `task_id`, `title`, `owner`, `priority`, `due_date`, `status`
2. 依赖字段：
   - `depends_on`
   - `depends_on_artifacts`
3. 执行字段：
   - `implementation_plan`
   - `verify_commands`
   - `expected_artifacts`
4. 台账字段：
   - `review_delta`
   - `recorded_at`
5. 执行后必须回写：
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - `tasks/TK-xxx.md`
   - 当前 sprint `review/`

## 10. 工具级完成态与 GA 指标

## 10.1 工具级完成态定义

1. 任意目标仓库可在 15 分钟内接入并跑通最小治理闭环。
2. Codex/Copilot/Claude Code 可在统一流程、权限、门禁下协作。
3. 高风险变更全部可解释、可审计、可人工接管。
4. 规范资产同源渲染一致，且 triad/brief 同步门禁默认阻断生效。
5. 发布链路具备契约测试、回滚策略与稳定输出。
6. 工具用户文档与升级说明足以独立指导接入、排障与升级。
7. examples 目录可执行，并通过 smoke 门禁。
8. 不经 npm 发布也可完成本地安装并稳定使用。
9. 至少一条多工具/多模型自动链路可在无人值守模式下稳定跑通，并具备策略闸口接管语义。
10. 人类可实时查看角色级进度、关键日志与交互状态，并完成必要人工决策。

## 10.2 GA Readiness 最小量化信号

1. 至少 2 个试点仓库完成 `install -> init -> doctor -> check` 首次成功路径，且单仓库接入耗时不超过 15 分钟。
2. 选定的两种本地安装模式在 clean-room 环境下各连续 3 次通过；每次至少覆盖 `--help -> init -> doctor -> check`。
3. GA 候选的黑盒用户路径矩阵 `init -> doctor -> check -> run -> report/replay` 必须 100% 通过。
4. 至少 1 条 `plan -> run -> review -> review-verify -> report -> ledger backfill` 无人值守链路连续 3 次 rehearsal 通过；若中断，原因必须归类为策略/HITL，而非未归因运行时失败。
5. 试点期的人工介入与失败事件必须全部具备结构化归因。
6. 至少 1 组 `tool_managed -> repo_local -> rollback` workspace 切换路径在 clean-room 环境通过。
7. 至少 1 组外部消费契约黑盒矩阵通过，覆盖配置优先级、workspace/i18n precedence 与 public export 边界。
8. 至少 1 主 1 备 HITL 通知渠道 rehearsal 通过，且通知回执能在 audit/replay 中回链。
9. 至少 1 条受控 delivery rehearsal 覆盖 `commit` 或 `PR draft`，并显式记录自动推送/发 PR 的开放边界。
10. 已声明最小支持矩阵，并完成矩阵内 clean-room smoke 记录。
11. 试点期产出运营指标快照：接入耗时、规范违规率、自动执行成功率、回滚率、人工介入率。

## 11. 维护规则

1. 若需求变化触及边界或优先级，先更新本计划，再推进实现。
2. 若 triad 文档发生语义变更，本计划应在同一变更窗口同步。
3. 本计划负责指导 project/sprint/task 拆解，不替代阶段性执行记录。
4. 若“工程门禁通过”与“外部可执行性验证”冲突，以外部可执行性为准阻断发布。
