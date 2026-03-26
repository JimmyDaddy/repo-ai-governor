# Graph-First Runtime And Service-Backed Execution Cutover ADR

- Status: active
- Date: 2026-03-26
- Module ID: `runtime.orchestration`
- ADR ID: `adr.runtime.orchestration.graph-first-service-cutover.v1`

## 1. Context

`project-016 / DA-163` 已把 graph-first execution 收敛为 primary path，`DA-164` 又把 `sidecar + ipc` orchestration host 变成正式 baseline。sprint-001 的 runtime.orchestration 文档还只是 skeleton，无法承载这两个完成态事实。

## 2. Decision

1. `graph_backend=langgraph` 作为当前 primary execution path 的公开结论保留在本模块 ADR 中。
2. `embedded`、`service-backed`、`sidecar_ipc` 三类 host surface 继续服从同一 execution contract。
3. parity harness 保留为迁移比较工具，不再作为 primary execution 语义的事实源。

## 3. Consequences

1. runtime.orchestration 继续通过 imported contract 引入 provider loading，不吸收 provider 细节。
2. host/transport 的承载方式变化多数属于 ADR 变化，只有公共字段或依赖 contract 改动才升级为 exported contract 变化。
3. 后续 desktop execution / service ops 的文档演进应优先回写到本模块 ADR，而不是重新膨胀总技术方案。

## 4. Source Anchors

1. `project-016 / DA-163`
2. `project-016 / DA-164`
