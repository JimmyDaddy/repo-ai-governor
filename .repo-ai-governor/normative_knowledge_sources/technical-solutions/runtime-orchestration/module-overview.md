# Runtime Orchestration Module Overview

- Status: active
- Date: 2026-04-04
- Module ID: `runtime.orchestration`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责将 `DSL / IR / policy / audit / ledger` 保持在产品域服务掌控下，并将 graph-first execution backend 作为执行内核接入统一 runtime path。

## 2. 职责边界

1. 组合 graph-first execution 与 facade selector。
2. 协调 provider loading、policy、artifact、notification 与 memory/session。
3. 为 CLI 与未来 desktop / service host 提供统一 orchestration seam。
4. 维持 `embedded / service-backed / sidecar_ipc` 三种 host surface 的一致执行约束。
5. 承载 service-owned `session.main` supervisor runtime 的 turn lifecycle、conversation classification、capability explanation、skill-intent resolution、risk-tiered handoff policy 与 role-subagent orchestration boundary，但不把 presenter 或 projection 层升格为新的 runtime owner。
6. 拥有 session-scoped provider continuation slot lifecycle、`laneKey` derivation、slot-aware mutation、invalidation rule 与 turn-level continuation summary projection，使 provider-native backend conversation continuity 始终受 shared session truth 约束。

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

## 7. Loading Guidance

1. 命中 `runtime_contract_change`、`governance_engine_change`、`module_dependency_change`、`technical_solution_module_change` 或 `technical_solution_promotion_change` 时加载。
2. 默认只加载 overview 与 direct imported contracts，不递归展开 transitive full docs。

## 8. Runtime Cutover Notes

1. graph-first runtime 已是 primary execution path，parity harness 回到迁移比较工具角色。
2. `sidecar + ipc` orchestration host 已形成正式 baseline；`daemon + http` 仍只保留为可选 follow-up，不属于当前 contract baseline。
3. vendor checkpoint / thread state 只作为 runtime owner 的恢复机制，不得升格为替代 `DSL / IR / policy / audit / ledger` 的 canonical source。
4. `runtime.memory-provider-loading` 与 `runtime.memory-semantics` 仍通过 contract 引入，不允许 runtime 模块直接耦合 provider 实现包或 recall policy internals。
5. 截至 `2026-03-31`，`v2` formal direction 已接受“service-owned session.main supervisor + role subagents / handoffs”作为前台自然语言入口的目标架构；该方向要求 runtime 在 answer / follow-up / command handoff / role collaboration 之间做正式 turn routing，但当前代码仍只完成 path-A productization，supervisor productization follow-up 由 `project-035-session-main-supervisor-and-role-subagent-productization` 承接。
6. 截至 `2026-04-01`，在既有 `session.main supervisor` formal direction 基础上，runtime 现进一步接受“conversation-first chatability + risk-tiered skill handoff”补充方向；shared session truth 必须同时承载 `preview_confirm` 与 `direct_execute` continuity，并由 service-owned risk/policy gate 决定 `help`、`doctor`、`verify` 与 scope-resolved `review` 等低风险 skill 是否允许直接执行。
7. 截至 `2026-04-02`，在既有 `session.main supervisor` formal direction 基础上，runtime 现进一步接受“service-owned capability explainer + contextual command guidance”补充方向；`runtime.orchestration` 必须拥有 locale-neutral governed capability catalog、availability overlay、capability explanation route 与 explanation-to-governed-execution bridge boundary，并将 capability answer metadata 投影到 shared session truth 供 CLI/desktop 统一消费。
8. 截至 `2026-04-04`，在既有 shared-session continuity 基础上，runtime 现进一步接受“lane-scoped provider-native continuation under shared-session truth”补充方向；`runtime.orchestration` 必须拥有 provider continuation slot lifecycle、turn-level continuation summaries 与 invalidation policy，但 raw provider handle 语义仍由 adapter/projection seam 持有。

## 9. Detail Docs

1. Contract:
   - `contracts/runtime-graph-execution-contract.md`
2. ADR:
   - `adrs/graph-first-runtime-and-service-backed-execution-cutover.md`
   - `adrs/session-main-supervisor-and-role-subagent-collaboration.md`
