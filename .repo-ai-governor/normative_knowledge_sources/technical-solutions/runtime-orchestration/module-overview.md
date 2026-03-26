# Runtime Orchestration Module Overview

- Status: active
- Date: 2026-03-26
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

## 3. 非目标

1. 不直接定义 memory provider 的内部装配规则。
2. 不替代 HITL 或 Spec Sync 的事实源。
3. 不允许 UI 入口直接绕过 service/runtime contract。

## 4. North Star References

1. `prd.multi-agent-orchestration`
2. `overall.graph-first-runtime`
3. `architecture.runtime-boundary`

## 5. Imported Contracts

1. `contract.memory-provider.loading.v1`

## 6. Exported Contracts

1. `contract.runtime.graph-execution.v1`

## 7. Loading Guidance

1. 命中 `runtime_contract_change`、`governance_engine_change`、`module_dependency_change` 时加载。
2. 默认只加载 overview 与 direct imported contracts，不递归展开 transitive full docs。

## 8. Runtime Cutover Notes

1. graph-first runtime 已是 primary execution path，parity harness 回到迁移比较工具角色。
2. `sidecar + ipc` orchestration host 已形成正式 baseline，但不扩张为跨 workspace daemon。
3. `runtime.memory-provider-loading` 仍通过 contract 引入，不允许 runtime 模块直接耦合 provider 实现包。

## 9. Detail Docs

1. Contract:
   - `contracts/runtime-graph-execution-contract.md`
2. ADR:
   - `adrs/graph-first-runtime-and-service-backed-execution-cutover.md`
