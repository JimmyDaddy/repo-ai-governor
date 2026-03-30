# Desktop Execution Surface

`integrations/desktop` 定义未来桌面端入口消费本地 orchestration service 的正式基线。

当前结论：

1. desktop execution surface 只能消费 `@repo-ai-governor/orchestration-service-client` 的 DTO / event contract。
2. 当前唯一推荐的本地 host / transport 组合是 `sidecar + ipc`。
3. `daemon + http` 仍只保留为后续选项，不进入当前产品化承诺。
4. 已发布根包如需在 clean-room 或桌面宿主中启动本地 service host，只能通过 `@cjhdev/repo-ai-governor/service-host` 这个公开入口；不允许深导入内部打包目录结构。
5. richer UI / desktop surface 如果要展示 agent projection，不应重新格式化原始 `agentView`；应优先复用 transport-neutral `AgentProjectionPanelViewModel` seam。当前第一正式 consumer 是 `connect` 的 command-level React shell。

## Baseline

当前 desktop baseline 约束如下：

1. `clientSurface=desktop`
2. `runtimeMode=sidecar_ipc`
3. `serviceHostKind=sidecar`
4. `serviceTransportKind=ipc`
5. execution list / subscribe / recovery / HITL 都必须继续走 service-owned contract，而不是访问 CLI/runtime 内部状态
6. memory provider 必须通过 shared loader 由 service host 自行解析，并在 `getHealth/startExecution/getExecution/listExecutions` 中回传 `memoryProvider` composition summary
7. 任何 future desktop panel 都应消费共享 `agent projection` panel/view-model seam，而不是直接耦合 `CliAgentProjectionPresenter` 或命令私有字符串摘要。

## Assets

1. 示例说明：`integrations/desktop/examples/README.md`
2. desktop sidecar baseline：`integrations/desktop/examples/desktop-sidecar-runtime.sample.json`
3. 当前 formal UI consumer 参考实现：`apps/cli/src/runtime/presentation/agent-projection-panel-view-model-builder.ts` + `apps/cli/src/react-cli/views/agent-projection-panel.tsx`

## Verification

本入口的正式 smoke 由以下命令承接：

1. `pnpm run check:desktop-entry-smoke`
2. `pnpm run release:verify-local`
3. `pnpm run release:verify-cleanroom-local-install`
