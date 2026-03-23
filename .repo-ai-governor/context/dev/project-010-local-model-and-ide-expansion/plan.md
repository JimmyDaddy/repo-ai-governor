# project-010-local-model-and-ide-expansion 计划

- Status: active
- Date: 2026-03-24
- Stage Mapping: Stage 9 follow-up backlog realization
- Phase Mapping: Phase C/D 扩展 + Adoption Integration

## 1. 目标

1. 落地本地模型适配路径（Ollama 类）官方基线，补齐受限网络场景可用执行面。
2. 将 IDE 集成从“骨架契约”升级为“可运营模板 + 可验证门禁”。
3. 形成 project-010 出口验收与下一轮 rollout 输入约束，确保 P1 backlog 可持续收敛。

## 2. 工作流分解（Workstreams）

1. WS-01 Local Model Adapter Baseline
   - 本地模型 adapter 协议、配置、能力矩阵、错误契约。
2. WS-02 Restricted-Network Routing And Rehearsal
   - 远端不可达时的本地回退、`doctor/verify` 诊断与演练基线。
3. WS-03 IDE Surface Productionization
   - 多 IDE surface registry、命令包装契约增强与模板化接入资产。
4. WS-04 IDE Smoke And Governance Gates
   - IDE 入口 smoke、契约一致性、文档与示例一致性门禁。
5. WS-05 Exit Acceptance And Rollout Input
   - project 级验收与后续输入约束交接。

## 2.1 全自动研发落地优先级（P0/P1）

1. P0-1 适配器真实调用收敛（`TK-096`）
   - 从 baseline stub 进入真实调用，补齐鉴权、重试、超时、限流与错误映射。
2. P0-2 深度可用性探测（`TK-095` + `TK-097`）
   - 从“命令存在”升级为“登录态 + 最小真实调用 + 能力矩阵 + 健康诊断”。
3. P0-3 任务驱动动态编排（`TK-098` 输入到 sprint-002）
   - 将固定模板流程升级为任务目标驱动输入，沉淀可执行编排约束。
4. P0-4 无人值守编排器闭环（`TK-098` 输入到 sprint-002）
   - 打通 `plan -> run -> review -> review-verify -> report -> ledger backfill` 自动推进语义。
5. P0-5 HITL 闭环执行（`TK-098` 输入到 sprint-002）
   - 形成 `confirm/escalate -> 通知回执 -> 决策回灌 -> 继续执行`。
6. P1-1 依赖产物自动注入（sprint-002 规划输入）
   - 将 artifact dependency resolver 接入运行时前置解析。
7. P1-2 Slot 执行接线（sprint-002 规划输入）
   - 从规则解析延伸到受控执行与审计回链。
8. P1-3 真实调用稳定性门禁（`TK-097` + sprint-002）
   - 覆盖 provider outage、fallback、受限网络、超时重试上限。

## 3. Sprint 细化

## 3.1 sprint-001-local-model-adapter-baseline

- Sprint Goal: 落地本地模型适配与受限网络回退的最小可执行基线，形成 sprint-002 输入约束。
- 任务包：`TK-095`、`TK-096`、`TK-097`、`TK-098`、`TK-103`、`TK-104`。
- Exit Criteria:
  1. 本地模型 adapter 契约与配置扩展完成，并通过 schema/类型/契约校验。
  2. 远端不可达场景可自动降级到本地模型路径，且失败语义可审计回链。
  3. `doctor --adapters` 与 `verify --adapters` 可输出本地模型相关 `pass/warn/fail` 与 `nextAction`。
  4. 形成 `DA-099`~`DA-102` 四项产物并通过台账一致性门禁。

## 3.2 sprint-002-ide-integration-productionization

- Sprint Goal: 落地多 IDE 官方模板与入口门禁，形成 project-010 出口验收与 rollout 输入约束。
- 任务包：`TK-099`、`TK-100`、`TK-101`、`TK-102`。
- Exit Criteria:
  1. 至少 2 类 IDE 入口可开箱执行 `init -> doctor -> check`。
  2. IDE wrapper 输出契约与 standards 注入顺序在各入口保持一致并可验证。
  3. IDE 示例与文档形成可执行资产并纳入 smoke 门禁。
  4. 形成 `DA-103`~`DA-106` 四项产物并完成 project-010 出口验收。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-095 | sprint-001 | 本地模型适配契约与配置扩展基线 | baseline/contract | DA-098 | completed |
| TK-096 | sprint-001 | Ollama 类 adapter 与 route fallback 基线 | implementation/adapter | TK-095 | planned |
| TK-097 | sprint-001 | 本地模型诊断校验与受限网络演练基线 | implementation/gate | TK-095,TK-096 | planned |
| TK-098 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance baseline | TK-095,TK-096,TK-097 | planned |
| TK-099 | sprint-002 | 多 IDE surface registry 与 wrapper 契约强化 | baseline/contract | TK-098 | planned |
| TK-100 | sprint-002 | VS Code/JetBrains 官方模板与 smoke 门禁 | implementation/ide-template | TK-099 | planned |
| TK-101 | sprint-002 | Cursor/Claude Code 接入模板与文档一致性 | implementation/ide-template | TK-099,TK-100 | planned |
| TK-102 | sprint-002 | project-010 出口验收与后续 rollout 输入约束 | acceptance baseline | TK-100,TK-101 | planned |
| TK-103 | sprint-001 | 全自动研发 gap 清单与 draft 收敛 | analysis/draft | DA-098,TK-095 | completed |
| TK-104 | sprint-001 | 主执行计划全自动研发 gap register 上收 | analysis/master-plan | TK-103,DA-098 | completed |

## 5. 依赖产物策略

1. project-010 启动入口默认消费 `DA-098`（project-009 出口验收与运营反馈约束）。
2. sprint-001 产物目标：`DA-099`~`DA-102`；sprint-002 产物目标：`DA-103`~`DA-106`。
3. 任务执行时统一使用 `artifact_id + artifact_path` 双键回链，并同步 `tasks.csv/checklist/artifact-registry`。
4. 仅“规范/基线/约束”类产物进入 registry，避免计划类文档噪音登记。

## 6. DoD（project-010）

1. 本地模型适配路径在受限网络场景可执行，且具备可诊断、可回放、可降级能力。
2. IDE 集成从 baseline 升级为可运营模板，至少两类 IDE 入口具备稳定接入路径。
3. 关键门禁（台账同步、artifact 生命周期、质量门禁）在新增能力后保持可复跑通过。
4. 项目任务台账与评审生命周期路径满足 `CS-021/CS-026`，无 `task card/checklist/tasks.csv` 漂移。

## 7. 里程碑记录

1. 2026-03-23：创建 `project-010` 执行骨架，完成 sprint/task 分解并切换主执行流。
2. 2026-03-23：基于“全自动研发落地清单”完成 P0/P1 优先级回填，并启动 `TK-095` 执行。
3. 2026-03-24：新增 `TK-103`，将“当前尚不能全自动研发”的根因分析收敛为正式 draft gap 清单，作为 `TK-096/TK-097/TK-098` 的输入约束。
4. 2026-03-24：`TK-095` 收尾完成，产出 `DA-099` 并完成 artifact registry 与台账同步，sprint-001 进入 `TK-096` 实施阶段。
5. 2026-03-24：新增 `TK-104`，将 draft gap 清单正式上收到 master execution plan，形成 Stage 9 follow-up 的正式 gap register。
