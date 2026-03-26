# Graph-First Runtime And Service-Backed Execution Cutover ADR

- Status: active
- Date: 2026-03-26
- Module ID: `runtime.orchestration`
- ADR ID: `adr.runtime.orchestration.graph-first-service-cutover.v1`

## 1. Context

`project-014 / DA-142` 已把 LangGraph adoption 从 draft-only 方案提升为正式 runtime direction，后续 `project-016 / DA-163` 又把 graph-first execution 收敛为 primary path，`DA-164` 把 `sidecar + ipc` orchestration host 变成正式 baseline。runtime.orchestration 的 skeleton 文档需要承载这条从 adoption 到 productization 的完成态事实链。

## 2. Decision

1. `graph_backend=langgraph` 作为当前 primary execution path 的公开结论保留在本模块 ADR 中。
2. `embedded`、`service-backed`、`sidecar_ipc` 三类 host surface 继续服从同一 execution contract。
3. parity harness 保留为迁移比较工具，不再作为 primary execution 语义的事实源。
4. `daemon + http` 继续保留为可选 follow-up，而不是当前 runtime.orchestration baseline 的组成部分。

## 3. Consequences

1. runtime.orchestration 继续通过 imported contract 引入 provider loading，不吸收 provider 细节。
2. host/transport 的承载方式变化多数属于 ADR 变化，只有公共字段或依赖 contract 改动才升级为 exported contract 变化。
3. 后续 desktop execution / service ops 的文档演进应优先回写到本模块 ADR，而不是重新膨胀总技术方案。
4. vendor checkpointer / thread state 只作为 runtime 恢复实现细节保留，不能替代产品域的公共事实链。

## 4. Source Anchors

1. `project-014 / DA-142`
2. `project-014 / DA-157`
3. `project-016 / DA-163`
4. `project-016 / DA-164`
