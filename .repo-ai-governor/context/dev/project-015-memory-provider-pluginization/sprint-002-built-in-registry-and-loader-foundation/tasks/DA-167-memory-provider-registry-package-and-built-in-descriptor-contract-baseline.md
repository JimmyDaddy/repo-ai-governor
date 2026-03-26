# DA-167 memory provider registry package 与 built-in descriptor 契约基线

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-167`
- Producer Execution: `exec-20260326-126`

## 1. 摘要

本产物冻结了 `memory provider` 的 Phase 1 built-in registry / loader 基线：新增 `@repo-ai-governor/memory-provider-registry` 作为正式包边界，收敛 `fs-csv` 与 `sqlite-fs` 的 built-in descriptor contract，并把 CLI 入口从直接选择 provider 实现切换为消费 registry loader 的结果。

## 2. 交付内容

1. 新包 [packages/memory-provider-registry](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry)
2. built-in descriptor contract
3. loader/runtime error contract
4. CLI entry cutover
5. runtime asset / local distribution 对齐

## 3. 关键实现

1. 新增 [MemoryProviderRegistry](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry/src/memory-provider-registry.ts)，统一处理：
   - legacy `storeEngine -> built-in provider id` 解析
   - built-in provider dynamic import
   - provider export / contract fail-closed 校验
2. 新增 built-in descriptor 常量：
   - [memory-provider-registry.constant.ts](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry/src/constants/memory-provider-registry.constant.ts)
3. CLI 入口不再直接 import `FsCsvMemoryStoreProvider` / `SqliteFsMemoryStoreProvider`：
   - [main.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts)
4. distribution runtime 已纳入新 package：
   - [copy-runtime-assets.js](/Users/jimmydaddy/study/ai-governor/scripts/build/copy-runtime-assets.js)
   - [verify-local-distribution.js](/Users/jimmydaddy/study/ai-governor/scripts/release/verify-local-distribution.js)

## 4. 冻结的契约

1. built-in provider id：
   - `fs-csv`
   - `sqlite-fs`
2. distribution mode：
   - `fs-csv = default`
   - `sqlite-fs = optional`
3. loader 输入：
   - `workspaceRoot`
   - `memoryConfig`
4. loader 输出：
   - `descriptor`
   - `memoryStoreRoot`
   - `providerName`
   - `provider`

## 5. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 6. 对后续任务的约束

1. `TK-168` 必须继续复用 `MemoryProviderRegistry`，不允许把 provider 选择逻辑重新塞回 CLI 入口。
2. `TK-169` 只收口 distribution/release 边界，不应改写 built-in descriptor 的语义来源。
