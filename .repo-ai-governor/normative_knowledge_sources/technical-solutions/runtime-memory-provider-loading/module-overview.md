# Runtime Memory Provider Loading Module Overview

- Status: active
- Date: 2026-03-26
- Module ID: `runtime.memory-provider-loading`
- Owner: runtime
- Layer: `runtime-core`

## 1. 作用

负责把 memory provider 的 registry、allowlist、host surface 与 runtime mode 收敛为统一加载契约，避免不同 host 各自复制 provider resolution 逻辑。

## 2. 职责边界

1. 解析 memory provider config。
2. 根据 registry / allowlist / module policy 选择 provider。
3. 对 CLI、desktop host 与 service-backed runtime 暴露统一 loading seam。
4. 维持 `host_surface / runtime_mode / composition summary` 的稳定 contract。

## 3. 非目标

1. 不直接承担 graph orchestration 调度。
2. 不替代 memory store provider 实现包本身。
3. 不负责 triad 或模块文档同步校验。

## 4. North Star References

1. `prd.multi-tool-adapters`
2. `overall.adapter-provider`
3. `architecture.runtime-boundary`

## 5. Dependencies

1. 无 direct imported contract。
2. `runtime.orchestration` 会消费本模块导出的 loading contract。
3. 迁移锚点来自 `project-015 / DA-175` 与 `DA-176` 的 shared loader cutover。

## 6. Exported Contracts

1. `contract.memory-provider.loading.v1`

## 7. Loading Guidance

1. 命中 `runtime_contract_change`、`adapter_change`、`memory_provider_change` 时加载。
2. 作为 direct dependency 时，优先只加载 contract。

## 8. Cutover Notes

1. CLI、desktop host 与 service-backed runtime 已收敛到同一条 shared loader seam。
2. host 不再复制 provider resolution 逻辑，而是统一透传 `memoryConfig` 给 shared loader / service host。
3. `summary` 字段应保持为 diagnostics、health 与 execution summary 的稳定共享面。

## 9. Detail Docs

1. Contract:
   - `contracts/memory-provider-loading-contract.md`
2. ADR:
   - `adrs/shared-loader-host-surface-cutover.md`
