# DA-171 memory provider plugin allowlist 与 registry resolution contract baseline

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-171`
- Producer Execution: `exec-20260326-139`

## 1. 摘要

本产物冻结了 `project-015 / sprint-003` 的 optional plugin baseline：`memory.provider.module` 现在具备正式的 allowlist / prefix / path / module policy，`memory-provider-registry` 新增了 plugin descriptor、plugin factory 与 resolution result contract，但默认 CLI 入口仍未切到 plugin execution。也就是说，`TK-171` 负责把“允许什么、禁止什么、加载契约长什么样”收成正式事实源，`TK-172` 再承接 CLI cutover。

## 2. 交付内容

1. plugin allowlist / prefix / path / module policy baseline
2. `memory-provider-registry` plugin descriptor / factory / resolution contract
3. `config schema` fail-closed 校验基线
4. runtime / schema 单测回归

## 3. 关键实现

1. 收敛 plugin 常量与契约：
   - [memory-provider-registry.constant.ts](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry/src/constants/memory-provider-registry.constant.ts)
   - [memory-provider-registry.interface.ts](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry/src/types/interfaces/memory-provider-registry.interface.ts)
   - 新增 `MemoryProviderPluginSpecifierKind`、`MemoryProviderPluginResolutionPolicyKind`、`MemoryProviderResolutionSource`
   - 新增 `MemoryProviderPluginPolicy`、`MemoryProviderPluginLoadContext`、`MemoryProviderPluginFactory`
2. `memory-provider-registry` 新增 plugin resolution seam：
   - [memory-provider-registry.ts](/Users/jimmydaddy/study/ai-governor/packages/memory-provider-registry/src/memory-provider-registry.ts)
   - 新增 `getPluginPolicy()`、`resolvePluginDescriptor()`、`resolveDescriptor()`、`loadPluginProvider()`
   - built-in 与 plugin 统一走 resolved descriptor / resolution source 模型
3. fail-closed policy 明确化：
   - 仅允许 bare package specifier 进入 optional plugin baseline
   - `file:`、绝对路径、相对路径一律 fail-closed
   - package specifier 必须命中 exact allowlist 或 prefix allowlist
4. config schema 收紧：
   - [schema-validator.ts](/Users/jimmydaddy/study/ai-governor/packages/config/src/schema-validator.ts)
   - 禁止 `provider.id + provider.module` 混用
   - 禁止 `exportName/options` 脱离 `provider.module`
   - `provider.module` 必须满足 bare package specifier 基线

## 4. 冻结的解析契约

1. `memory.provider.id`
   - 继续只用于 built-in provider 选择，不与 `provider.module` 混用
2. `memory.provider.module`
   - 当前只接受 allowlist-controlled bare package specifier
   - `file:`、绝对路径、相对路径、任意 workspace path 不在本轮承诺范围
3. plugin export contract
   - 默认导出名为 `createMemoryStoreProvider`
   - plugin 通过 factory 接收 `workspaceRoot`、`memoryStoreRoot`、`providerOptions`、`hostSurface`、`runtimeMode`
4. resolution source
   - registry 必须显式区分 `legacy_store_engine`、`built_in_id`、`plugin_module`

## 5. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts packages/config/test/config.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 6. 对后续任务的约束

1. `TK-172` 只能复用本产物冻结的 plugin resolution seam，不得重新定义 `provider.module` 语义。
2. `TK-172` 的 CLI cutover 必须显式暴露 plugin source diagnostics，区分 built-in 与 plugin resolution source。
3. `TK-173` 的 plugin-enabled distribution 只能放大当前 allowlist/prefix policy 的可用性，不能回退到任意模块执行。
