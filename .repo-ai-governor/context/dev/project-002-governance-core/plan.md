# project-002-governance-core 计划

- Status: active
- Date: 2026-03-20
- Stage Mapping: Stage 2-3
- Phase Mapping: Phase A/B

## 1. 目标

1. 跑通流程编排与执行状态机（`Sequential/Parallel/Loop/Condition`）。
2. 交付 Memory/Session/Store 基线，支撑 Runtime 稳定读写与快照回放。
3. 交付策略门禁与 HITL（`allow/confirm/block/escalate`）并接入通知分发。
4. 确保策略输入来自结构化规则资产，避免风险语义散落在脚本中。

## 2. 工作流分解（Workstreams）

1. WS-01 Process Compiler 与 Runtime
   - DSL 表达与 Compiler IR v1 契约。
   - Runtime 控制流执行与跳步限制、重试/超时/取消基础语义。
2. WS-02 Memory 与 Session
   - `core-memory`、`core-session`、`memory-store-adapter` 契约。
   - `memory-providers/fs-csv` 基线实现与会话快照链路。
3. WS-03 Risk/Policy/HITL
   - Change Risk Evaluator 统一风险事实。
   - Policy Gate Engine 决策与人工回灌字段。
4. WS-04 Notification 与策略输入
   - Notification Dispatcher + fallback 通道基线。
   - Standards 策略输入基线（`pack registry + policy rule compiler`）。

## 3. Sprint 细化

## 3.1 sprint-001-process-runtime-and-memory-baseline

- Sprint Goal: 完成 Stage 2 的最小治理闭环（编排、运行时、记忆会话）。
- 任务包：`TK-013` ~ `TK-016`，`TK-021`。
- Exit Criteria:
  1. Compiler IR v1 契约可落盘并可被 Runtime 消费。
  2. Runtime 支持四类控制流节点并具备中断/超时基础语义。
  3. Memory/Session/Store 基线可稳定读写并可回放关键执行快照。
  4. 形成 sprint-001 验收基线与 sprint-002 输入约束清单。

## 3.2 sprint-002-policy-hitl-and-notification-baseline

- Sprint Goal: 完成 Stage 3 的策略门禁、HITL 与通知分发闭环。
- 任务包：`TK-017` ~ `TK-020`。
- Exit Criteria:
  1. Risk Evaluator 输出可驱动 `allow/confirm/block/escalate`。
  2. Policy Gate 与 HITL 回灌字段可写回执行台账并审计可追踪。
  3. Notification Dispatcher 支持主备通道与失败升级。
  4. 形成 project-002 统一验收与 project-003 输入约束清单。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-013 | sprint-001 | Process DSL 与 Compiler IR v1 基线 | baseline/contract | TK-012 | completed |
| TK-014 | sprint-001 | Runtime 控制流执行基线 | baseline/constraints | TK-013 | in_progress |
| TK-015 | sprint-001 | Memory/Session/Store 基线 | baseline/contract | TK-013,TK-014 | planned |
| TK-016 | sprint-001 | sprint-001 出口验收基线 | acceptance baseline | TK-013,TK-014,TK-015 | planned |
| TK-021 | sprint-001 | CS-013 类型声明收敛 | governance/baseline | TK-014 | completed |
| TK-017 | sprint-002 | Change Risk Evaluator 基线 | baseline/policy | TK-016 | planned |
| TK-018 | sprint-002 | Policy Gate Engine 基线 | baseline/policy | TK-017 | planned |
| TK-019 | sprint-002 | HITL 与 Notification Dispatcher 基线 | baseline/constraints | TK-017,TK-018 | planned |
| TK-020 | sprint-002 | sprint-002 出口验收与回滚基线 | acceptance baseline | TK-017,TK-018,TK-019 | planned |

## 5. 依赖产物策略

1. project-002 规划入口默认消费 `DA-018`（sprint-002 验收基线）与 `DA-019`（Stage 2 输入就绪清单）。
2. sprint-001 产物目标：`DA-020`~`DA-024`；sprint-002 产物目标：`DA-025`~`DA-029`。
3. 任务执行时使用 `artifact_id + artifact_path` 双键回链，并同步 `tasks.csv/checklist/dependency-artifact-registry`。

## 6. DoD（project-002）

1. Stage 2-3 的核心契约（Compiler/Runtime/Memory/Session/Risk/Policy/HITL）形成可测试基线。
2. 高风险动作可触发人工确认，且决策可回放到审计链路。
3. 关键产物与任务台账同步完整，无 `task card/checklist/tasks.csv` 漂移。
4. `pnpm run check` 稳定通过，且生命周期门禁可阻断陈旧依赖回流。
