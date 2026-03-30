# Desktop Examples

当前 desktop 产品化基线只收敛一个正式候选：

1. desktop client 通过 `sidecar + ipc` 连接本地 orchestration service
2. desktop client 只消费 transport-neutral DTO / event stream
3. desktop client 不直接持有 runtime internals，也不旁路 artifact / recovery / HITL contract
4. memory provider 必须由 service host 通过 shared loader 解析，desktop 只消费 `memoryProvider` composition summary
5. packaged local host bootstrap 只能通过 `@cjhdev/repo-ai-governor/service-host`，不能依赖内部 `dist/node_modules` 目录结构

## Projection Consumer Seam

desktop / richer UI 如需显示 `agent projection`，当前推荐复用以下正式 seam，而不是直接消费命令私有字符串摘要：

1. transport-neutral panel view-model builder：`apps/cli/src/runtime/presentation/agent-projection-panel-view-model-builder.ts`
2. panel view-model type：`apps/cli/src/types/interfaces/cli-agent-projection-panel.interface.ts`
3. 首个正式 consumer：`apps/cli/src/react-cli/views/agent-projection-panel.tsx`，当前由 `connect` command-level React shell 接入

这条 seam 的目标是让 desktop surface 继续以 shared `agentView` 为事实来源，同时复用 phase-2 已正式化的 presenter / panel contract。

示例文件：

1. `desktop-sidecar-runtime.sample.json`

该示例用于：

1. 固定 desktop surface 的默认 `runtimeMode`
2. 固定期望的 `serviceHostKind / serviceTransportKind`
3. 固定 default / plugin-enabled 两条 memory provider 预期基线
4. 为 `check:desktop-entry-smoke` 和 release local verification 提供统一输入
