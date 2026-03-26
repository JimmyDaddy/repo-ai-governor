# DA-175 memory provider shared loader contract 与 host surface baseline

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-175`

## 1. 基线结论

`memory-provider-registry` 已从 CLI-only loader 提升为 CLI、desktop host 与 service-backed runtime 共用的 shared loader seam。`hostSurface`、`runtimeMode` 与 `memoryProvider` composition summary 已形成正式 contract。

## 2. 本轮收敛结果

1. `MemoryProviderRegistryLoadResult` 已正式暴露 `hostSurface`、`runtimeMode` 与 `summary`。
2. `MemoryProviderCompositionSummary` 已成为 CLI diagnostics、orchestration-service health/start/list/get 共享的稳定字段集。
3. `LocalOrchestrationServiceShell` 已通过 shared loader 自行解析 memory provider，而不是由调用方在 host 外部拼接 provider diagnostics。
4. sidecar 源码 loader 已补齐 `memory-provider-registry`、`memory-store-adapter` 与 built-in provider 包映射，shared loader 在 source-sidecar 模式下可真实工作。

## 3. 关键实现锚点

1. `packages/memory-provider-registry/src/memory-provider-registry.ts`
2. `packages/memory-provider-registry/src/types/interfaces/memory-provider-registry.interface.ts`
3. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-loader.ts`

## 4. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `pnpm run check`
