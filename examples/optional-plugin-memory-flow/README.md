# Example: Optional Plugin Memory Flow

## 输入

1. 已构建 `plugin-enabled distribution`。
2. 目标仓库允许生成 `.repo-ai-governor/governor.yaml`。
3. 使用受控 allowlist 中的 `@repo-ai-governor/memory-provider-sqlite-fs` 作为 `memory.provider.module`。

## 命令

```bash
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

## 预期输出

1. 三条命令均返回 JSON payload，且 `status=success`。
2. `diagnostics.memoryStoreResolutionSource=plugin_module`。
3. `diagnostics.memoryStoreProviderModule=@repo-ai-governor/memory-provider-sqlite-fs`。
4. `diagnostics.memoryStoreDistributionMode=optional`。

## 排障

1. 若命令报 `MEMORY_STORE_PROVIDER_NOT_FOUND`，检查 plugin-enabled distribution 是否包含 optional provider。
2. 若命令报 `MEMORY_STORE_PROVIDER_EXPORT_INVALID`，检查 provider package 是否导出了 `createMemoryStoreProvider`。
3. 若仍回落到 built-in provider，检查 `governor.yaml` 中 `memory.provider.module` 是否被正确写入并带引号。

## 可执行资产

1. 机器可执行场景：`examples/optional-plugin-memory-flow/scenario.json`
2. 固定输入约束：`examples/optional-plugin-memory-flow/fixtures/input.md`
3. 运行基线断言：`examples/optional-plugin-memory-flow/expected/runtime-baseline.json`
