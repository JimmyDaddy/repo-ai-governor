# DA-168 CLI memory provider loader cutover 与 legacy config 兼容

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-168`
- Producer Execution: `exec-20260326-128`

## 1. 摘要

本产物冻结了 CLI memory provider loader cutover 的兼容基线：`apps/cli` 不再在入口层直接决定 provider 组合逻辑，而是统一消费 `MemoryProviderRegistry`；同时保持 legacy `storeEngine` 的 parser/selection 兼容，并为后续 optional plugin 阶段预留 `memory.provider` 扩展位，但当前仅允许 `provider.id` 参与 built-in 选择，`provider.module` 明确 fail-closed。若解析到 `sqlite-fs` optional built-in provider，则 workspace/monorepo 环境可在 provider 包存在时完成加载，而默认发行包必须显式 fail-closed。

## 2. 交付内容

1. CLI loader cutover baseline
2. `memory.provider` shared/config contract 扩展
3. legacy `storeEngine` parser/selection compatibility baseline
4. loader diagnostics / integration tests / docs 对齐

## 3. 关键实现

1. 扩展 shared memory runtime config：
   - [memory-runtime-config.interface.ts](/Users/jimmydaddy/study/ai-governor/packages/shared/src/types/interfaces/memory-runtime-config.interface.ts)
   - 新增 `MemoryProviderRuntimeConfig`
   - `MemoryRuntimeConfig` 新增 `provider` 扩展槽位
2. 扩展 config schema validator：
   - [schema-validator.ts](/Users/jimmydaddy/study/ai-governor/packages/config/src/schema-validator.ts)
   - 接受 `memory.provider.id/module/exportName/options`
   - 继续要求 canonical `storeEngine` 在正式 config 中存在
3. 收敛 built-in loader 选择逻辑：
   - [memory-provider-registry.ts](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry/src/memory-provider-registry.ts)
   - `provider.id` 可选中 built-in descriptor
   - `provider.module` 当前保留为 future slot，并以 `MEMORY_STORE_PROVIDER_INIT_FAILED` fail-closed
   - `provider.id` 与 `storeEngine` 不一致时 fail-closed
4. CLI diagnostics 对齐 loader 输出：
   - [main.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts)
   - [cli-output.interface.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/types/interfaces/cli-output.interface.ts)
   - 新增 `memoryStoreProviderId` / `memoryStoreDistributionMode`
5. 同步 registry README：
   - [README.md](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry/README.md)

## 4. 冻结的兼容契约

1. `storeEngine` 继续作为 legacy/canonical built-in 选择入口。
2. `memory.provider.id` 允许显式声明 built-in provider，且必须与 `storeEngine` 保持一致。
3. `memory.provider.module` 在 `sprint-002` 阶段不开放；一旦配置，直接 fail-closed。
4. CLI diagnostics 必须显式暴露实际选中的 provider id 与 distribution mode，避免 release/distribution 面继续隐式耦合。
5. 当 `storeEngine` 或 `provider.id` 解析到 `sqlite-fs` optional built-in provider 时，默认发行包不得继续宣称运行时可用；缺失 provider package 时必须以明确的 default-distribution fail-closed 语义终止。

## 5. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 6. 对后续任务的约束

1. `TK-169` 只能在 distribution/release 面收口 optional built-in provider，不应回退 `memory.provider` 的 truthfulness。
2. `TK-170` 必须把 “default distribution 对 `sqlite-fs` 仅保留 parser/selection compatibility，运行时 fail-closed” 与 `provider.module = future optional plugin slot` 一并写入 sprint-003 输入约束。
