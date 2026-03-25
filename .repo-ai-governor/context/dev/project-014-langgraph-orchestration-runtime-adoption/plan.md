# project-014-langgraph-orchestration-runtime-adoption 计划

- Status: active
- Date: 2026-03-25
- Stage Mapping: Post-Stage-9 runtime modernization
- Phase Mapping: Phase E Follow-Up Runtime Modernization

## 1. 目标

1. 将已经确认采用的 `LangGraph` 方向正式并入 triad 与 master execution plan。
2. 在不破坏现有 `DSL -> IR -> policy -> audit -> ledger` 领域边界的前提下，冻结 `Process Runtime -> LangGraph` 的适配边界与迁移约束。
3. 收敛 `CLI + future desktop` 共用一套 `shared local orchestration service` 的执行面，为后续 dual-runtime parity、checkpoint 和 HITL resume 统一实现铺路。

## 2. 工作流分解（Workstreams）

1. WS-01 Triad And Master Plan Integration
   - 将 `LangGraph` 采用决策正式并入 PRD/brief/overall/architecture/master plan，并切换当前执行流。
2. WS-02 Runtime Adapter Boundary
   - 定义 `Process Runtime Facade -> LangGraph Runtime Adapter` 的职责边界、state contract 与 canonical source 约束。
3. WS-03 Shared Local Orchestration Service
   - 定义 `CLI` 与未来 `desktop client` 共用同一 orchestration service 的接口、状态与 ownership 边界。
4. WS-04 Dual-Run Migration And Spike
   - 规划 `legacy runtime / langgraph runtime` 并存、parity 验收、checkpoint 策略与 rollout 路径。

## 3. Sprint 细化

## 3.1 sprint-001-runtime-adoption-and-migration-baseline

- Sprint Goal: 冻结 LangGraph 采用决策、runtime adapter 边界、shared local orchestration service 目标形态，以及 Phase 0/1 的迁移验收口径。
- 任务包：`TK-142`、`TK-143`、`TK-144`、`TK-145`、`TK-146`。
- Exit Criteria:
  1. triad、brief 与 master execution plan 已正式登记 `LangGraph` 采用决策，且当前主执行流切换到 `project-014`。
  2. `Process Runtime -> LangGraph` 的边界、state contract、canonical source 约束和 side-effect idempotency 基线已冻结。
  3. `CLI + future desktop` 共用 `shared local orchestration service` 的接口边界、状态所有权与 rollout 约束已明确。
  4. Phase 0 spike、dual-runtime parity、checkpointer 路径与 sprint-002 输入约束已形成正式产物。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-142 | sprint-001 | LangGraph 采用决策并入 triad/master plan 与 project-014 启动 | baseline/analysis | draft + project-013 completion | completed |
| TK-143 | sprint-001 | Process Runtime -> LangGraph adapter 边界与 state contract 基线 | architecture/contract | TK-142,DA-142 | planned |
| TK-144 | sprint-001 | shared local orchestration service（CLI + desktop）契约基线 | architecture/service | TK-142,DA-142 | planned |
| TK-145 | sprint-001 | LangGraph Phase 0 spike、dual-runtime parity 与 rollout 迁移计划 | spike/plan | TK-143,TK-144 | planned |
| TK-146 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance/baseline | TK-143,TK-144,TK-145 | planned |

## 5. 依赖产物策略

1. project-014 启动入口默认消费：
   - `DA-142`
   - `project-013-remote-provider-and-adapter-ops-completion-audit-summary.md`
   - `DA-136` ~ `DA-141`
2. sprint-001 产物目标：`DA-142` ~ `DA-146`。
3. `LangGraph` 方向的基线/约束类产物进入 artifact registry；过程性草稿、review 讨论与临时实验记录不登记。
   - `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md` 只保留为 traceback/background，不再作为后续任务的 formal required input。
4. 所有后续实现仍需遵守 `project-011` 的 CLI bounded-context 边界与 `project-012` 的 execution-context / task-ledger / review-chain 治理基线。

## 6. DoD（project-014）

1. `LangGraph` 已从 draft 方案升级为 triad 与 master plan 中的正式 runtime adoption 决策。
2. `LangGraph` 与现有 `DSL/IR/policy/audit/ledger` 的边界明确，且不引入新的 canonical source。
3. `CLI` 与未来 `desktop` 共用 `shared local orchestration service` 的目标形态、接口边界与 rollout 路径明确。
4. dual-runtime parity、checkpointer 策略、Phase 0 spike 验收和后续 sprint 输入约束具备正式基线文档。

## 7. 里程碑记录

1. 2026-03-25：创建 `project-014`，将 `LangGraph` 采用决策正式收敛为 post-Stage-9 runtime modernization 主线，并切换为新的 active primary stream。
