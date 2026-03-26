# Shared Loader Host Surface Cutover ADR

- Status: active
- Date: 2026-03-26
- Module ID: `runtime.memory-provider-loading`
- ADR ID: `adr.runtime.memory-provider-loading.shared-loader-cutover.v1`

## 1. Context

`project-015 / DA-175` 与 `DA-176` 已证明 memory provider loader 不再是 CLI-only seam。CLI、desktop host 与 service-backed runtime 都已经切到同一条 shared loader 路径，因此模块文档必须明确这个 cutover，而不是继续保留“不同 host 自己解释 provider”式的旧叙述。

## 2. Decision

1. `host_surface` 与 `runtime_mode` 视为本模块的稳定公共语义。
2. host 侧只透传 `memoryConfig` 与消费 `summary`，不在 host 边界外复制 resolution 逻辑。
3. provider resolution 失败保持 fail-closed，并由 shared loader 统一给出 diagnostics summary。

## 3. Consequences

1. `runtime.orchestration` 必须通过 `contract.memory-provider.loading.v1` 引入 provider loading，不允许直连实现包。
2. 文档层的 host surface 调整大多属于 ADR 变化，而非 exported contract breaking change。
3. 后续若新增 host，只要服从同一 `host_surface / runtime_mode / summary` contract，就不需要重写该模块边界。

## 4. Source Anchors

1. `project-015 / DA-175`
2. `project-015 / DA-176`
