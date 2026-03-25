# Desktop Execution Surface

`integrations/desktop` 定义未来桌面端入口消费本地 orchestration service 的正式基线。

当前结论：

1. desktop execution surface 只能消费 `@repo-ai-governor/orchestration-service-client` 的 DTO / event contract。
2. 当前唯一推荐的本地 host / transport 组合是 `sidecar + ipc`。
3. `daemon + http` 仍只保留为后续选项，不进入当前产品化承诺。

## Baseline

当前 desktop baseline 约束如下：

1. `clientSurface=desktop`
2. `runtimeMode=sidecar_ipc`
3. `serviceHostKind=sidecar`
4. `serviceTransportKind=ipc`
5. execution list / subscribe / recovery / HITL 都必须继续走 service-owned contract，而不是访问 CLI/runtime 内部状态

## Assets

1. 示例说明：`integrations/desktop/examples/README.md`
2. desktop sidecar baseline：`integrations/desktop/examples/desktop-sidecar-runtime.sample.json`

## Verification

本入口的正式 smoke 由以下命令承接：

1. `pnpm run check:desktop-entry-smoke`
2. `pnpm run release:verify-local`
