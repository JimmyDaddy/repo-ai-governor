# project-016-langgraph-runtime-productization 计划

- Status: completed
- Date: 2026-03-26
- Stage Mapping: Post-Stage-9 runtime modernization follow-up
- Phase Mapping: Runtime Productization / Vendor Adapter + Service Host

## 1. 目标

1. 将 `core-runtime-langgraph` 从 adoption shell 提升为 truthful vendor-backed graph runtime adapter。
2. 收敛 graph-first orchestration engine 的正式执行语义，减少 migration scaffolding 对长期架构的污染。
3. 将 `sidecar + ipc` 收敛为正式本地 orchestration service host，并为 desktop execution surface 提供产品化入口。

## 2. Sprint 细化

## 2.1 sprint-001-vendor-adapter-and-sidecar-baseline

- Sprint Goal: 冻结 LangGraph full productization 的第一轮实现边界，建立 vendor adapter、graph-first execution 与 `sidecar + ipc` host 的正式 baseline。
- 任务包：`TK-161`、`TK-162`、`TK-163`、`TK-164`、`TK-165`、`TK-166`。
- Exit Criteria:
  1. 社区 LangGraph vendor adoption 与 package truthfulness 路线已经明确。
  2. graph-first execution semantics 与 migration scaffolding 的收敛策略形成正式基线。
  3. `sidecar + ipc` host、desktop execution path 与 service ops/release baseline 的任务边界已冻结。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-161 | sprint-001 | project-016 启动与 LangGraph runtime productization 重排 | bootstrap/plan | DA-160 | completed |
| TK-162 | sprint-001 | 社区 LangGraph vendor adapter 与 package truthfulness 基线 | architecture/runtime | TK-161,DA-160,DA-161 | completed |
| TK-163 | sprint-001 | graph-first execution semantics 与 selector/cutover hardening | implementation/runtime | TK-161,TK-162,DA-143,DA-145,DA-148,DA-160,DA-162 | completed |
| TK-164 | sprint-001 | `sidecar + ipc` orchestration host 与 transport 基线 | implementation/service-host | TK-161,TK-162,DA-144,DA-151,DA-157,DA-160,DA-162,DA-163 | completed |
| TK-165 | sprint-001 | desktop execution surface 与 service ops/release baseline | implementation/desktop-ops | TK-163,TK-164,DA-157,DA-160,DA-162,DA-163,DA-164 | completed |
| TK-166 | sprint-001 | sprint-001 出口验收与后续 rollout 输入约束 | acceptance/baseline | TK-162,TK-163,TK-164,TK-165,DA-160,DA-162,DA-163,DA-164,DA-165 | completed |

## 4. 依赖产物策略

1. `project-016` 启动默认消费：
   - `project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md`
   - `DA-143`
   - `DA-144`
   - `DA-145`
   - `DA-148`
   - `DA-151`
   - `DA-157`
   - `DA-160`

## 5. DoD（project-016）

1. LangGraph vendor/runtime truthfulness 已与实际实现一致。
2. graph-first orchestration engine 已形成正式执行语义，而非仅保留 adoption skeleton。
3. `sidecar + ipc` 形成正式本地 service host baseline，desktop execution surface 具备可继续 rollout 的产品化入口。

## 6. 里程碑记录

1. 2026-03-26：创建 planned `project-016`，承接 `project-014` 未完成的 LangGraph full productization 残余项。
2. 2026-03-26：通过 `TK-161 / DA-161` 将 `project-016` 提升为 active primary stream，并冻结 sprint-001 的 bootstrap 输入边界。
3. 2026-03-26：通过 `TK-166 / DA-166` 完成 sprint-001 出口验收，并生成 [project-016 完成态审计摘要](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-016-langgraph-runtime-productization/project-016-langgraph-runtime-productization-completion-audit-summary.md)。
