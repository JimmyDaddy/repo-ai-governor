# Runtime Orchestration Module Overview

- Status: active
- Date: 2026-04-22
- Module ID: `runtime.orchestration`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责将 `DSL / IR / policy / audit / ledger` 保持在产品域服务掌控下，并将 graph-first execution backend 作为执行内核接入统一 runtime path。

## 2. 职责边界

1. 组合 graph-first execution 与 facade selector。
2. 协调 provider loading、policy、artifact、notification 与 memory/session。
3. 为 CLI、VS Code governance workbench 与未来 desktop / service host 提供统一 orchestration seam。
4. 维持 `embedded / service-backed / sidecar_ipc` 三种 host surface 的一致执行约束。
5. 承载 service-owned `session.main` supervisor runtime 的 turn lifecycle、conversation classification、capability explanation、skill-intent resolution、risk-tiered handoff policy 与 role-subagent orchestration boundary，但不把 presenter 或 projection 层升格为新的 runtime owner。
6. 拥有 session-scoped provider continuation slot lifecycle、`laneKey` derivation、slot-aware mutation、invalidation rule 与 turn-level continuation summary projection，使 provider-native backend conversation continuity 始终受 shared session truth 约束。
7. 拥有面向 governance workbench 的 service-owned aggregation facade：task board、review queue、workflow preview / stage progress、automation queue、adoption / host operations bridge 等 read model 与 mutation seam 必须由 orchestration/service 层统一暴露，但不得把 task/review/install receipt 真值迁入 runtime shadow state。
8. 拥有 direct-workbench follow-up runtime seam：workflow draft session、role lane status、session continuity 与 HITL decision packet 的 query/mutation contract 必须由 orchestration/service 层统一暴露，并继续把 revision/concurrency、risk/SLA reuse 与 backlink replay 保持在 shared runtime truth 内。

## 3. 非目标

1. 不直接定义 memory provider 的内部装配规则。
2. 不替代 HITL 或 Spec Sync 的事实源。
3. 不允许 UI 入口直接绕过 service/runtime contract。
4. 不让 provider thread / response / conversation handle 升格为新的 canonical session source。

## 4. North Star References

1. `prd.multi-agent-orchestration`
2. `overall.graph-first-runtime`
3. `architecture.runtime-boundary`

## 5. Imported Contracts

1. `contract.memory-provider.loading.v1`
2. `contract.memory.context-assembly.v1`

## 6. Exported Contracts

1. `contract.runtime.graph-execution.v1`
2. `contract.runtime.session-main.capability-interaction-model.v1`
3. `contract.runtime.session-main.delivery-orchestration.v1`
4. `contract.runtime.governance-workbench-aggregation-facade.v1`
5. `contract.runtime.direct-workbench-orchestration-runtime-hitl.v1`

## 7. Loading Guidance

1. 命中 `runtime_contract_change`、`governance_engine_change`、`module_dependency_change`、`technical_solution_module_change` 或 `technical_solution_promotion_change` 时加载。
2. 默认只加载 overview 与 direct imported contracts，不递归展开 transitive full docs。

## 8. Runtime Cutover Notes

1. graph-first runtime 已是 primary execution path，parity harness 回到迁移比较工具角色。
2. `sidecar + ipc` orchestration host 已形成正式 baseline；`daemon + http` 仍只保留为可选 follow-up，不属于当前 contract baseline。
3. vendor checkpoint / thread state 只作为 runtime owner 的恢复机制，不得升格为替代 `DSL / IR / policy / audit / ledger` 的 canonical source。
4. `runtime.memory-provider-loading` 与 `runtime.memory-semantics` 仍通过 contract 引入，不允许 runtime 模块直接耦合 provider 实现包或 recall policy internals。
5. 截至 `2026-03-31`，`v2` formal direction 已接受“service-owned session.main supervisor + role subagents / handoffs”作为前台自然语言入口的目标架构；该方向要求 runtime 在 answer / follow-up / command handoff / role collaboration 之间做正式 turn routing，但当前代码仍只完成 path-A productization，supervisor productization follow-up 由 `project-035-session-main-supervisor-and-role-subagent-productization` 承接。
6. 截至 `2026-04-01`，在既有 `session.main supervisor` formal direction 基础上，runtime 现进一步接受“conversation-first chatability + risk-tiered skill handoff”补充方向；shared session truth 必须以 `direct_execute` 作为 governed handoff 默认路径，同时继续兼容 `preview_confirm` continuity，并由 service-owned risk/policy gate 与命令级契约共同决定何时需要显式确认。
7. 截至 `2026-04-02`，在既有 `session.main supervisor` formal direction 基础上，runtime 现进一步接受“service-owned capability explainer + contextual command guidance”补充方向；`runtime.orchestration` 必须拥有 locale-neutral governed capability catalog、availability overlay、capability explanation route 与 explanation-to-governed-execution bridge boundary，并将 capability answer metadata 投影到 shared session truth 供 CLI/desktop 统一消费。
8. 截至 `2026-04-04`，在既有 shared-session continuity 基础上，runtime 现进一步接受“lane-scoped provider-native continuation under shared-session truth”补充方向；`runtime.orchestration` 必须拥有 provider continuation slot lifecycle、turn-level continuation summaries 与 invalidation policy，但 raw provider handle 语义仍由 adapter/projection seam 持有。
9. 截至 `2026-04-06`，本模块进一步接受“standards-native review engine + provenance-aware governed CR”补充方向：`runtime.orchestration` 必须拥有 review-rule projection 的执行顺序、`deterministic -> delegated` 混合评审流水线、finding dedupe、same-round verify 与 fresh recheck 分叉语义，但 canonical `CR-xxx` / review artifact 真值仍由既有治理链路承载。
10. 截至 `2026-04-10`，本模块进一步接受“session.main prompt-first command model and deterministic workflow split”补充方向：`runtime.orchestration` 现正式拥有 capability interaction model truth，用于区分 `raw role entry / AI fixed workflow / deterministic utility / pending existence review / explain only`，并要求 public `/verify` 从 command model 中移除，同时把 `run` 收窄为 reusable governed execution flow。
11. 截至 `2026-04-16`，本模块进一步接受“requirement-to-CR governed delivery orchestration”补充方向：`runtime.orchestration` 现正式拥有 `deliver` 这一 parent `ai_fixed_workflow` capability、`delivery brief` preview 到 approved durable brief 的阶段边界，以及 `requirement_review / solution_review / task_plan_commit / review_verify` 等 phase overlay 对既有 canonical governance truth 的 backlink mapping；`deliver` 可以消费既有 `plan / review / review_verify / run`，但不得替代这些 child workflow 自身的 artifact 与 lifecycle 真值。
12. 截至 `2026-04-16`，本模块进一步接受“governance workbench aggregation facade”补充方向：`runtime.orchestration` 现正式拥有面向 VS Code primary workbench 的 service-owned query / command aggregation seam，用于统一暴露 `task_board / task_detail / review_queue / workbench_overview / workflow_preview / execution_stage_progress / automation_queue / adoption_status / host_distribution_status` 等 projection；其中 task/review/install receipt 的 canonical truth 仍留在既有治理 surfaces，typed CLI bridge 也只能作为 temporary path 并带明确 exit criteria。
13. 截至 `2026-04-22`，本模块进一步接受“direct workbench orchestration / runtime status bus / HITL decision packet”补充方向：`runtime.orchestration` 现正式拥有 `workflow draft session`、`role lane status`、`session continuity` 与 `hitl decision packet` 的 direct-workbench service seam；workflow mutation 必须带 revision/base-token 并返回 conflict state，runtime lanes 继续保持 projection-only owner split，HITL decision packet 必须完整复用 risk facts / SLA / `default_timeout_action` 语义；真实 implementation rollout 由 `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout` 承接。

## 9. Detail Docs

1. Contract:
   - `contracts/runtime-graph-execution-contract.md`
   - `contracts/session-main-capability-interaction-model-contract.md`
   - `contracts/session-main-delivery-orchestration-contract.md`
   - `contracts/governance-workbench-aggregation-facade-contract.md`
   - `contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
2. ADR:
   - `adrs/graph-first-runtime-and-service-backed-execution-cutover.md`
   - `adrs/session-main-supervisor-and-role-subagent-collaboration.md`
   - `adrs/session-main-prompt-first-command-model-and-deterministic-workflow-split.md`
   - `adrs/standards-native-review-engine-and-provenance-aware-cr.md`
   - `adrs/requirement-to-cr-governed-delivery-orchestration.md`
