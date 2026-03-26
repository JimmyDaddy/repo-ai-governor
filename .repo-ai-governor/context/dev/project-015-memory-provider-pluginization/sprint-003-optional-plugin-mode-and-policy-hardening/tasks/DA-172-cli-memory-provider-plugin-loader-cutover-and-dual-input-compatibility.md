# DA-172 CLI memory provider plugin loader cutover 与 dual-input compatibility

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-172`
- Producer Execution: `exec-20260326-141`

## 1. 摘要

本产物收口了 `project-015 / sprint-003` 的 CLI cutover：CLI 入口现在不再只会走 built-in loader，而是通过统一 `MemoryProviderRegistry.loadProvider()` 同时处理 `storeEngine`、`memory.provider.id` 与受控的 `memory.provider.module`。这意味着 dual-input compatibility 继续保留，但当配置显式进入 plugin mode 时，CLI diagnostics 会真实暴露 `plugin_module` 解析来源，而不是继续把插件路径伪装成 built-in 选择。

## 2. 交付内容

1. CLI registry loader cutover baseline
2. plugin source diagnostics baseline
3. dual-input compatibility integration baseline
4. plugin success / fail-closed integration tests

## 3. 关键实现

1. 统一 registry load path：
   - [memory-provider-registry.ts](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry/src/memory-provider-registry.ts)
   - `loadProvider()` 现在统一走 resolved descriptor / resolution source，而不是只承接 built-in path
2. provider package plugin factory export：
   - [fs-csv index.ts](/Users/jimmydaddy/study/ai-governor/packages/memory-providers/fs-csv/src/index.ts)
   - [sqlite-fs index.ts](/Users/jimmydaddy/study/ai-governor/packages/memory-providers/sqlite-fs/src/index.ts)
   - built-in provider 现在也显式暴露 `createMemoryStoreProvider`，从而支持受控 plugin module contract
3. CLI diagnostics 补齐：
   - [main.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts)
   - [cli-output.interface.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/types/interfaces/cli-output.interface.ts)
   - 新增 `memoryStoreProviderModule`、`memoryStoreResolutionSource`
4. dual-input / fail-closed 回归：
   - [memory-provider-registry.unit.test.ts](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts)
   - [memory-store-config-and-cli-composition.integration.test.ts](/Users/jimmydaddy/study/ai-governor/test/memory-store-config-and-cli-composition.integration.test.ts)
   - [cli-output-contract.integration.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/cli-output-contract.integration.test.ts)

## 4. 冻结的兼容语义

1. `memory.provider.module`
   - 优先级高于 `provider.id` / `storeEngine`
   - 命中后必须以 `plugin_module` diagnostics 外显
2. `memory.provider.id`
   - 继续保留 built-in descriptor 选择语义
3. `memory.storeEngine`
   - 继续保留 legacy shortcut / fallback 语义
4. plugin failure
   - 不回落到隐式 built-in provider
   - 必须保持 fail-closed 并暴露稳定错误码

## 5. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/examples/check-examples-smoke.js`
4. `pnpm run check`

## 6. 对后续任务的约束

1. `TK-173` 不得绕过当前 registry seam 直接在 release/clean-room 脚本里硬编码 provider package 选择逻辑。
2. plugin-enabled distribution 必须复用本产物已经建立的 `memoryStoreResolutionSource=plugin_module` diagnostics。
3. sprint-004 若引入 service reuse，必须继续共享这一条 loader seam，而不是在 service host 内复制一套 provider selection 规则。
