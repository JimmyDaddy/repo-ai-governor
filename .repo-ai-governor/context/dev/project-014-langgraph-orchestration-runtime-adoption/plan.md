# project-014-langgraph-orchestration-runtime-adoption 计划

- Status: completed
- Date: 2026-03-25
- Stage Mapping: Post-Stage-9 runtime modernization
- Phase Mapping: Phase E Follow-Up Runtime Modernization

## 1. 目标

1. 将已经确认采用的 `LangGraph` 方向正式并入 triad 与 master execution plan。
2. 在不破坏现有 `DSL -> IR -> policy -> audit -> ledger` 领域边界的前提下，冻结 `Process Runtime -> LangGraph` 的适配边界与迁移约束。
3. 收敛 `CLI + future desktop` 共用一套 `shared local orchestration service` 的执行面，为后续 LangGraph cutover 验证、checkpoint 和 HITL resume 统一实现铺路。

## 2. 工作流分解（Workstreams）

1. WS-01 Triad And Master Plan Integration
   - 将 `LangGraph` 采用决策正式并入 PRD/brief/overall/architecture/master plan，并切换当前执行流。
2. WS-02 Runtime Adapter Boundary
   - 定义 `Process Runtime Facade -> LangGraph Runtime Adapter` 的职责边界、state contract 与 canonical source 约束。
3. WS-03 Shared Local Orchestration Service
   - 定义 `CLI` 与未来 `desktop client` 共用同一 orchestration service 的接口、状态与 ownership 边界。
4. WS-04 Cutover Validation And Spike
   - 规划 `LangGraph` cutover、短期 parity 验证 harness、checkpoint 策略与 rollout 路径；`legacy runtime` 仅作为迁移验证基线，不作为长期并存架构。

## 3. Sprint 细化

## 3.1 sprint-001-runtime-adoption-and-migration-baseline

- Sprint Goal: 冻结 LangGraph 采用决策、runtime adapter 边界、shared local orchestration service 目标形态，以及 Phase 0/1 的迁移验收口径。
- 任务包：`TK-142`、`TK-143`、`TK-144`、`TK-145`、`TK-146`。
- Exit Criteria:
  1. triad、brief 与 master execution plan 已正式登记 `LangGraph` 采用决策，且当前主执行流切换到 `project-014`。
  2. `Process Runtime -> LangGraph` 的边界、state contract、canonical source 约束和 side-effect idempotency 基线已冻结。
  3. `CLI + future desktop` 共用 `shared local orchestration service` 的接口边界、状态所有权与 rollout 约束已明确。
  4. Phase 0 spike、LangGraph cutover parity 验证口径、checkpointer 路径与 sprint-002 输入约束已形成正式产物。

## 3.2 sprint-002-langgraph-phase0-spike-and-service-shell

- Sprint Goal: 落地 `LangGraph` Phase 0 最小闭环，实现 graph backend、短期 parity harness、checkpoint/recovery 与 shared local orchestration service shell 的第一轮正式接线。
- 任务包：`TK-147`、`TK-148`、`TK-149`、`TK-150`、`TK-151`、`TK-152`。
- Exit Criteria:
  1. `core-runtime-langgraph` backend skeleton 已能消费 `compiled IR` 并输出标准化 execution events / interrupt / terminal status。
  2. facade backend selector、短生命周期 parity harness 与 file-backed recovery smoke 已形成正式基线。
3. `run -> review -> review-verify -> HITL -> recovery` 的 LangGraph 最小主链已完成第一轮正式接线，并保持 canonical source 回写不漂移。
4. `sqlite-fs` checkpointer 与 `shared local orchestration service` shell 已形成可继续扩展的正式 baseline，并沉淀 `DA-147` ~ `DA-152`。

## 3.3 sprint-003-service-backed-execution-and-desktop-transport

- Sprint Goal: 将 in-process service shell 扩展为稳定的 service-backed execution 基线，收敛 transport-neutral / desktop-ready client contract，并完成 LangGraph cutover 的 service path 扩围验证。
- 任务包：`TK-153`、`TK-154`、`TK-155`、`TK-156`、`TK-157`、`TK-158`。
- Exit Criteria:
  1. service owner 已稳定持有 `start/get/list/stream/submitHitlDecision/recover` 级 execution API，且执行状态、checkpoint 与 event stream 不再散落在 CLI 内部。
  2. `orchestration-service-client` 已形成 transport-neutral、desktop-ready 的 request/response/event DTO 基线，CLI 与未来 desktop 可复用同一 client contract。
  3. CLI 的 `run/review/HITL/recovery` 已以 service client 为入口，LangGraph cutover parity 已扩围到 service-backed path。
  4. sprint-003 已产出 `DA-153` ~ `DA-158`，并对 `project-014` 是否进入完成态给出正式判定。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-142 | sprint-001 | LangGraph 采用决策并入 triad/master plan 与 project-014 启动 | baseline/analysis | draft + project-013 completion | completed |
| TK-143 | sprint-001 | Process Runtime -> LangGraph adapter 边界与 state contract 基线 | architecture/contract | TK-142,DA-142 | completed |
| TK-144 | sprint-001 | shared local orchestration service（CLI + desktop）契约基线 | architecture/service | TK-142,DA-142,DA-143 | completed |
| TK-145 | sprint-001 | LangGraph Phase 0 spike、cutover parity 验证与 rollout 迁移计划 | spike/plan | TK-143,TK-144,DA-143,DA-144 | completed |
| TK-146 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance/baseline | TK-143,TK-144,TK-145,DA-143,DA-144,DA-145 | completed |
| TK-147 | sprint-002 | core-runtime-langgraph backend skeleton 与 compiled IR graph adapter 基线 | implementation/runtime | DA-143,DA-145,DA-146 | completed |
| TK-148 | sprint-002 | Process Runtime facade backend selector 与 cutover parity harness 基线 | implementation/runtime | TK-147,DA-143,DA-145,DA-146 | completed |
| TK-149 | sprint-002 | file-backed checkpointer 与 recovery smoke 基线 | implementation/recovery | TK-147,DA-143,DA-145,DA-146 | completed |
| TK-150 | sprint-002 | LangGraph `run/review/HITL` 最小主链接线 | implementation/mainchain | TK-147,TK-148,TK-149,DA-144,DA-145,DA-146 | completed |
| TK-151 | sprint-002 | `sqlite-fs` checkpointer 与 shared local orchestration service shell 收敛 | implementation/service | TK-148,TK-149,TK-150,DA-144,DA-145,DA-146 | completed |
| TK-152 | sprint-002 | sprint-002 出口验收与 sprint-003 输入约束 | acceptance/baseline | TK-147,TK-148,TK-149,TK-150,TK-151 | completed |
| TK-153 | sprint-003 | shared local orchestration service execution API 与 runtime owner 收敛 | implementation/service | TK-151,DA-144,DA-151,DA-152 | completed |
| TK-154 | sprint-003 | orchestration-service-client transport-neutral streaming 与 desktop-ready DTO hardening | implementation/client-contract | TK-153,DA-144,DA-151,DA-152 | completed |
| TK-155 | sprint-003 | service-backed HITL、recovery 与 execution list contract 收口 | implementation/service | TK-153,TK-154,DA-144,DA-150,DA-151,DA-152 | completed |
| TK-156 | sprint-003 | CLI `run/review/HITL/recovery` 到 orchestration-service-client 的 cutover | implementation/cli-cutover | TK-153,TK-154,TK-155,DA-150,DA-151,DA-152 | completed |
| TK-157 | sprint-003 | LangGraph service-backed parity 扩围与 daemon/desktop-ready transport spike | implementation/parity-spike | TK-153,TK-154,TK-155,TK-156,DA-145,DA-152 | completed |
| TK-158 | sprint-003 | sprint-003 出口验收与 project-014 完成态判定 | acceptance/baseline | TK-153,TK-154,TK-155,TK-156,TK-157 | completed |

## 5. 依赖产物策略

1. project-014 启动入口默认消费：
   - `DA-142`
   - `project-013-remote-provider-and-adapter-ops-completion-audit-summary.md`
   - `DA-136` ~ `DA-141`
2. sprint-001 产物目标：`DA-142` ~ `DA-146`。
3. sprint-002 产物目标：`DA-147` ~ `DA-152`。
4. sprint-002 默认正式输入消费：`DA-143`、`DA-144`、`DA-145`、`DA-146`。
5. sprint-003 产物目标：`DA-153` ~ `DA-158`。
6. sprint-003 默认正式输入消费：`DA-144`、`DA-145`、`DA-150`、`DA-151`、`DA-152`。
7. `LangGraph` 方向的基线/约束类产物进入 artifact registry；过程性草稿、review 讨论与临时实验记录不登记。
   - `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md` 只保留为 traceback/background，不再作为后续任务的 formal required input。
8. 所有后续实现仍需遵守 `project-011` 的 CLI bounded-context 边界与 `project-012` 的 execution-context / task-ledger / review-chain 治理基线。

## 6. DoD（project-014）

1. `LangGraph` 已从 draft 方案升级为 triad 与 master plan 中的正式 runtime adoption 决策。
2. `LangGraph` 与现有 `DSL/IR/policy/audit/ledger` 的边界明确，且不引入新的 canonical source。
3. `CLI` 与未来 `desktop` 共用 `shared local orchestration service` 的目标形态、接口边界与 rollout 路径明确。
4. LangGraph cutover parity 验证口径、checkpointer 策略、Phase 0 spike 验收和后续 sprint 输入约束具备正式基线文档。

## 7. 里程碑记录

1. 2026-03-25：创建 `project-014`，将 `LangGraph` 采用决策正式收敛为 post-Stage-9 runtime modernization 主线，并切换为新的 active primary stream。
2. 2026-03-25：`sprint-001-runtime-adoption-and-migration-baseline` 通过 `DA-146` 完成出口验收，正式冻结 sprint-002 的 LangGraph backend、shared local orchestration service 与 checkpoint/recovery 输入约束。
3. 2026-03-25：完成 `sprint-002-langgraph-phase0-spike-and-service-shell` 拆解，并将 active primary stream 切换到 runtime/service 实装主线。
4. 2026-03-25：`sprint-002-langgraph-phase0-spike-and-service-shell` 通过 `DA-152` 完成出口验收，正式冻结 sprint-003 的 service-backed execution、desktop-ready contract 与 cutover 扩围输入约束。
5. 2026-03-25：完成 `sprint-003-service-backed-execution-and-desktop-transport` 拆解，并将 active primary stream 切换到 service-backed execution / desktop-ready transport 主线。
6. 2026-03-25：`sprint-003-service-backed-execution-and-desktop-transport` 通过 `DA-158` 完成出口验收；`project-014` 达到完成态，项目级审计摘要为 `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md`。
