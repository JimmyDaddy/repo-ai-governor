# Runtime Graph Execution Contract

- Status: active
- Date: 2026-03-26
- Contract ID: `contract.runtime.graph-execution.v1`
- Producer Module: `runtime.orchestration`

## 1. 目标

定义 graph-first orchestration execution path 的最小输入输出与依赖约束。

## 2. Minimum Fields

1. `execution_id`
2. `execution_session_id`
3. `compiled_ir_ref`
4. `graph_backend`
5. `runtime_mode`
6. `host_surface`
7. `policy_outcome`
8. `audit_sink_ref`
9. `dependency_inputs[]`

## 3. Behavioral Constraints

1. `DSL -> IR -> policy -> audit -> ledger` 必须继续由产品域服务掌控。
2. graph backend 不得升格为新的 canonical source。
3. direct dependency 应通过稳定 contract 引入，而不是直接耦合实现包。
4. `runtime_mode` 与 `host_surface` 必须在 embedded / service-backed / sidecar_ipc 三种路径下保持可比较语义。
5. checkpoint / thread state 可以由 runtime host 持有用于恢复执行，但不得替代产品域的 audit / ledger facts 作为公共事实源。

## 4. Imported Contracts

1. `contract.memory-provider.loading.v1`

## 5. Compatibility

1. `v1` 允许 `graph_backend` 以 `langgraph` 为 primary path。
2. `v1` 不要求暴露 vendor-specific internal state 作为公共 contract。
3. `v1` 允许 orchestration host 在同一 contract 下切换 `embedded` 与 `sidecar_ipc` 承载方式。
4. `v1` 不将 `daemon_http` 视为必需 host surface；跨 workspace daemon 仍属于后续可选扩展。
