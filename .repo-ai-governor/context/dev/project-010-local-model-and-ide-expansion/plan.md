# project-010-local-model-and-ide-expansion 计划

- Status: active
- Date: 2026-03-24
- Stage Mapping: Stage 9 follow-up backlog realization
- Phase Mapping: Phase E follow-up + Adoption Integration

## 1. 目标

1. 先完成 Stage 9 的自动主链收口基础：真实调用、任务驱动编排、review 子链内联与 HITL 决策回灌。
2. 再完成 delivery rehearsal、黑盒/GA 指标与多 IDE 官方入口 productionization。
3. 形成 project-010 出口验收与下一轮 rollout 输入约束，确保 Stage 9 follow-up 可持续收敛。

## 2. 工作流分解（Workstreams）

1. WS-01 Local Model Adapter Baseline
   - 本地模型 adapter 协议、配置、能力矩阵、错误契约。
2. WS-02 Restricted-Network Routing And Rehearsal
   - 远端不可达时的本地回退、`doctor/verify` 诊断与演练基线。
3. WS-03 Autonomous Mainchain Foundation
   - 任务驱动 DAG、`run` 主链装配、review 子链内联与 ledger backfill。
4. WS-04 HITL / Delivery / Blackbox Closure
   - 决策回执回灌、delivery rehearsal、黑盒 E2E、CI/release 与 GA 指标。
5. WS-05 IDE Surface Productionization
   - 多 IDE surface registry、命令包装契约增强与模板化接入资产。
6. WS-06 Exit Acceptance And Rollout Input
   - project 级验收与后续输入约束交接。

## 2.2 支撑依赖

1. `project-011-cli-package-decomposition` 是 `project-010` 的工程支撑主线，用于承接 CLI package 的 bounded-context 拆分与 thin facade 重构。
2. `project-011` 已完成正式 handoff；`project-010` sprint-002 及之后的 CLI 主链改动，应优先消费 `DA-121`、`DA-122`、`DA-123` 与 `project-011-cli-package-decomposition-completion-audit-summary.md`，不再默认继续扩写 `apps/cli/src/cli-governance-runtime.ts`。
3. 若确需暂时在 legacy 文件上落地例外，必须遵循 `CS-027` 的例外登记规则，并在对应 task 中明确回收计划。
4. `project-012-execution-context-optimization` 已完成正式 handoff；`project-010` 后续任务默认遵循 `DA-124`~`DA-127` 与 `project-012-execution-context-optimization-completion-audit-summary.md` 所冻结的 startup baseline、active stream 边界与任务卡输入分层约束。

## 2.1 全自动研发落地优先级（P0/P1）

1. P0-1 适配器真实调用收敛（`TK-096`）
   - 从 baseline stub 进入真实调用，补齐鉴权、重试、超时、限流与错误映射。
2. P0-2 深度可用性探测（`TK-095` + `TK-097`）
   - 从“命令存在”升级为“登录态 + 最小真实调用 + 能力矩阵 + 健康诊断”。
3. P0-3 任务驱动动态编排（`TK-099`）
   - 将固定模板流程升级为任务目标驱动 DAG，沉淀可执行编排约束。
4. P0-4 无人值守编排器闭环（`TK-100`）
   - 打通 `run -> review -> review-verify -> ledger backfill` 自动推进语义。
5. P0-5 HITL 闭环执行（`TK-101`）
   - 形成 `confirm/escalate -> 通知回执 -> 决策回灌 -> 继续执行`。
6. P0-6 受控交付演练（`TK-107`）
   - 将 `commit/PR draft` rehearsal 接入 audit/replay 与人工接管边界。
7. P0-7 黑盒与 GA 指标收口（`TK-108`）
   - 覆盖 provider outage、fallback、受限网络、重试耗尽与 release gate。
8. P1-1 依赖产物自动注入（sprint-002 规划输入）
   - 将 artifact dependency resolver 接入运行时前置解析。
9. P1-2 Slot 执行接线（sprint-002 规划输入）
   - 从规则解析延伸到受控执行与审计回链。
10. P1-3 IDE official surfaces（`TK-109` ~ `TK-111`）
   - 在自动主链稳定后再扩大多 IDE 官方入口与模板覆盖。

## 3. Sprint 细化

## 3.1 sprint-001-local-model-adapter-baseline

- Sprint Goal: 落地本地模型适配与受限网络回退的最小可执行基线，形成 sprint-002 输入约束。
- 任务包：`TK-095`、`TK-096`、`TK-097`、`TK-098`、`TK-103`、`TK-104`、`TK-105`、`TK-106`、`TK-113`、`TK-114`。
- Exit Criteria:
  1. 本地模型 adapter 契约与配置扩展完成，并通过 schema/类型/契约校验。
  2. 远端不可达场景可自动降级到本地模型路径，且失败语义可审计回链。
  3. `doctor --adapters` 与 `verify --adapters` 可输出本地模型相关 `pass/warn/fail` 与 `nextAction`。
  4. 形成 `DA-099`~`DA-102` 四项产物并通过台账一致性门禁。

## 3.2 sprint-002-autonomous-mainchain-foundation

- Sprint Goal: 在 `project-011` 提供的 CLI decomposition 边界上，将 Stage 9 自动主链从固定模板升级为任务驱动受控链路，形成 sprint-003 的明确输入约束。
- 任务包：`TK-099`、`TK-100`、`TK-101`、`TK-102`。
- Exit Criteria:
  1. `run` 可按任务目标、依赖产物、角色能力装配可执行 DAG。
  2. `review -> review-verify -> ledger backfill` 可作为自动主链子链推进，并与审计事实一致。
  3. HITL 决策回执支持 `resume/terminate/degrade`，且至少 1 条通知路径可复跑验证。
  4. 形成 `DA-103`~`DA-106` 四项产物并完成 sprint-002 出口验收。

## 3.3 sprint-003-delivery-ide-and-ga-hardening

- Sprint Goal: 完成 delivery rehearsal、黑盒/GA 指标与多 IDE 官方入口 productionization，并收尾 project-010。
- 任务包：`TK-107`、`TK-108`、`TK-109`、`TK-110`、`TK-111`、`TK-112`。
- Exit Criteria:
  1. 至少 1 条受控 `commit` 或 `PR draft` rehearsal 可回放、可审计、可人工接管。
  2. 黑盒 E2E、CI、release gate 覆盖主路径与降级路径，并沉淀 GA 指标。
  3. 至少 2 类 IDE 入口具备官方模板与 smoke 门禁，Cursor/Claude Code 文档与 contracts/examples 一致。
  4. 形成 `DA-107`~`DA-112` 六项产物，完成 project-010 出口验收与完成态审计摘要。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-095 | sprint-001 | 本地模型适配契约与配置扩展基线 | baseline/contract | DA-098 | completed |
| TK-096 | sprint-001 | Ollama 类 adapter 与 route fallback 基线 | implementation/adapter | TK-095 | completed |
| TK-097 | sprint-001 | 本地模型诊断校验与受限网络演练基线 | implementation/gate | TK-095,TK-096 | completed |
| TK-098 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance baseline | TK-095,TK-096,TK-097 | completed |
| TK-099 | sprint-002 | 任务驱动 DAG 与 `run` 主链装配 | implementation/runtime | TK-098,TK-118 | in_progress |
| TK-100 | sprint-002 | review 子链内联与 ledger backfill 收口 | implementation/runtime | TK-099 | planned |
| TK-101 | sprint-002 | HITL 决策回执与恢复执行语义 | implementation/runtime | TK-099,TK-100 | planned |
| TK-102 | sprint-002 | sprint-002 出口验收与 sprint-003 输入约束 | acceptance baseline | TK-099,TK-100,TK-101 | planned |
| TK-103 | sprint-001 | 全自动研发 gap 清单与 draft 收敛 | analysis/draft | DA-098,TK-095 | completed |
| TK-104 | sprint-001 | 主执行计划全自动研发 gap register 上收 | analysis/master-plan | TK-103,DA-098 | completed |
| TK-105 | sprint-001 | 主执行计划结构重梳与执行导航重构 | analysis/master-plan | TK-104 | completed |
| TK-106 | sprint-001 | triad 文档 Stage 9 overlay 补强同步 | analysis/triad-sync | TK-105 | completed |
| TK-107 | sprint-003 | 受控 delivery rehearsal 与 audit/replay 集成 | implementation/delivery | TK-102 | planned |
| TK-108 | sprint-003 | 黑盒 E2E、CI/release gate 与 GA 指标收口 | implementation/gate | TK-102,TK-107 | planned |
| TK-109 | sprint-003 | 多 IDE surface registry 与 wrapper 契约强化 | baseline/contract | TK-102 | planned |
| TK-110 | sprint-003 | VS Code/JetBrains 官方模板与 smoke 门禁 | implementation/ide-template | TK-109 | planned |
| TK-111 | sprint-003 | Cursor/Claude Code 接入模板与文档一致性 | implementation/ide-template | TK-109,TK-110 | planned |
| TK-112 | sprint-003 | project-010 出口验收与后续 rollout 输入约束 | acceptance baseline | TK-107,TK-108,TK-110,TK-111 | planned |
| TK-113 | sprint-001 | project-010 Stage 9 执行重排与 sprint rebaseline | analysis/planning | TK-106 | completed |
| TK-114 | sprint-001 | cli-governance-runtime 拆分方案与 anti-God-object 规范基线 | analysis/governance | TK-113 | completed |

## 5. 依赖产物策略

1. project-010 启动入口默认消费 `DA-098`（project-009 出口验收与运营反馈约束）。
2. sprint-001 产物目标：`DA-099`~`DA-102`；sprint-002 产物目标：`DA-103`~`DA-106`；sprint-003 产物目标：`DA-107`~`DA-112`。
3. 任务执行时统一使用 `artifact_id + artifact_path` 双键回链，并同步 `tasks.csv/checklist/artifact-registry`。
4. 仅“规范/基线/约束”类产物进入 registry，避免计划类文档噪音登记。

## 6. DoD（project-010）

1. 本地模型适配路径在受限网络场景可执行，且具备可诊断、可回放、可降级能力。
2. `run/review/HITL/delivery` 自动主链达到可受控无人值守推进的最低收口标准。
3. IDE 集成从 baseline 升级为可运营模板，至少两类 IDE 入口具备稳定接入路径。
4. 黑盒/CI/release gate 与 GA 指标可覆盖主路径与降级路径。
5. 项目任务台账与评审生命周期路径满足 `CS-021/CS-026`，无 `task card/checklist/tasks.csv` 漂移。

## 7. 里程碑记录

1. 2026-03-23：创建 `project-010` 执行骨架，完成 sprint/task 分解并切换主执行流。
2. 2026-03-23：基于“全自动研发落地清单”完成 P0/P1 优先级回填，并启动 `TK-095` 执行。
3. 2026-03-24：新增 `TK-103`，将“当前尚不能全自动研发”的根因分析收敛为正式 draft gap 清单，作为 `TK-096/TK-097/TK-098` 的输入约束。
4. 2026-03-24：`TK-095` 收尾完成，产出 `DA-099` 并完成 artifact registry 与台账同步，sprint-001 进入 `TK-096` 实施阶段。
5. 2026-03-24：新增 `TK-104`，将 draft gap 清单正式上收到 master execution plan，形成 Stage 9 follow-up 的正式 gap register。
6. 2026-03-24：新增 `TK-105`，重构 master execution plan 的组织方式，使其收敛为面向当前执行的导航文档。
7. 2026-03-24：新增 `TK-106`，将 Stage 9 follow-up 的技术/架构含义回锚到 triad，补齐总技术方案、架构蓝图及 PRD/brief 的最小同步。
8. 2026-03-24：新增 `TK-113`，将 `project-010` 从 IDE-first 重排为 mainchain-first：新建 `sprint-002-autonomous-mainchain-foundation`，并将原 `sprint-002` 顺延为 `sprint-003-delivery-ide-and-ga-hardening`。
9. 2026-03-24：完成 `TK-096`，将本地模型路径从契约基线升级为真实 Ollama 类 `probe/invoke` 与自动 fallback candidate，为 `TK-097` 的 deep probe 和受限网络演练提供唯一实现输入。
10. 2026-03-24：完成 `TK-097`，将本地模型失败归因、`doctor` safe_local 边界、restricted-network CLI rehearsal 与 resilience regression 场景收口为 `DA-101`，为 `TK-098` 出口验收提供唯一门禁证据。
11. 2026-03-24：新增并完成 `TK-114`，将 `cli-governance-runtime.ts` 的拆分方案沉淀到 draft，并在 `code_standards.md` / `long-term-maintenance-guide.md` 正式建立 anti-God-object 治理基线。
12. 2026-03-24：创建 `project-011-cli-package-decomposition` 作为工程支撑主线，并将 `project-010` sprint-002 的 CLI 结构重构前置依赖切换为 `TK-118/DA-116`。
13. 2026-03-24：`project-011` 完成收口并正式回链 `DA-121/DA-122/DA-123 + completion audit summary`，后续 `project-010` CLI 主链工作统一以该 handoff 为工程边界输入。
14. 2026-03-24：完成 `TK-098` 并产出 `DA-102`，正式确认 sprint-001 出口验收通过，同时冻结 sprint-002 的自动主链优先输入约束。
15. 2026-03-24：`project-012` 完成收口并正式回链 `DA-124/DA-125/DA-126/DA-127 + completion audit summary`，后续 `project-010` 默认遵循更轻量的 startup/context/task-input 约束继续推进。
