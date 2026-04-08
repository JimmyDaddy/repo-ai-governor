# Desktop Execution Surface

`integrations/desktop` 定义未来桌面端入口消费本地 orchestration service 的正式基线。

当前结论：

1. desktop execution surface 只能消费 `@repo-ai-governor/orchestration-service-client` 的 DTO / event contract。
2. 当前唯一推荐的本地 host / transport 组合是 `sidecar + ipc`。
3. `daemon + http` 仍只保留为后续选项，不进入当前产品化承诺。
4. 已发布根包如需在 clean-room 或桌面宿主中启动本地 service host，只能通过 `@cjhdev/repo-ai-governor/service-host` 这个公开入口；不允许深导入内部打包目录结构。
5. richer UI / desktop surface 如果要展示 agent projection，不应重新格式化原始 `agentView`；应优先复用 transport-neutral `AgentProjectionPanelViewModel` seam。当前第一正式 consumer 是 `connect` 的 command-level React shell。
6. 当前桌面端正式实现入口已经冻结到 `apps/desktop`：它负责 shell bootstrap、typed preload bridge、session bridge、governance console transport-neutral view-model，以及 lifecycle / restart / artifact-pane gate baseline。

## Baseline

当前 desktop baseline 约束如下：

1. `clientSurface=desktop`
2. `runtimeMode=sidecar_ipc`
3. `serviceHostKind=sidecar`
4. `serviceTransportKind=ipc`
5. execution list / subscribe / recovery / HITL 都必须继续走 service-owned contract，而不是访问 CLI/runtime 内部状态
6. memory provider 必须通过 shared loader 由 service host 自行解析，并在 `getHealth/startExecution/getExecution/listExecutions` 中回传 `memoryProvider` composition summary
7. 任何 future desktop panel 都应消费共享 `agent projection` panel/view-model seam，而不是直接耦合 `CliAgentProjectionPresenter` 或命令私有字符串摘要。
8. 当前 desktop governance console 已冻结为 `execution board + HITL inbox + queue overview + artifact pane` 的 service-owned read-model 组合，renderer 不能自行拼 execution/HITL/path/workspace truth。
9. `artifact pane` 在 `sprint-003` 起已补齐 evidence-oriented detail：`policy trace`、`review lifecycle navigation`、`artifact & review workbench` 与 `governance evidence backlinks`，仍然只消费 orchestration-owned DTO。
10. `queue overview` 在 `sprint-004` 起正式补齐 `automation inbox / review queue / parallel lane / workspace summary / notification ownership`，follow-up SLA 与 notification ownership 继续由 service-owned DTO 承担。
11. `getExecution / submitHitlDecision / recoverExecution / terminateExecution / queryExecutionBoard / queryHitlInbox / queryQueueOverview / queryArtifactPane` 已纳入正式 preload/service seam。
12. worktree / editor / terminal / review doc handoff 必须走 service-owned handoff target contract，renderer 不得自行重建路径真值。

## Project-065 Decision Guardrails

1. `project-065` 继续把 desktop 保留为 foundation-only surface，不把它提升为当前更优先收口的 secondary surface。
2. 当前 baseline 不是 packaged desktop distribution 的正式支持声明；正式证明路径固定为 built governor source checkout + `pnpm run check:desktop-entry-smoke` + `pnpm run release:verify-local`。
3. 当前没有正式支持的 standalone desktop installer、published desktop bundle 或 desktop-specific upgrader。
4. richer desktop panels 可以继续演进，但不应在本项目里反向扩张 public support claim 或要求与 VS Code MVP 做功能对等承诺。

## Assets

1. 示例说明：`integrations/desktop/examples/README.md`
2. desktop sidecar baseline：`integrations/desktop/examples/desktop-sidecar-runtime.sample.json`
3. 当前 formal shell/bootstrap implementation：`apps/desktop/src/runtime/desktop-shell-bootstrap.ts`
4. 当前 actionable console builder：`apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts`
5. 当前 shared agent projection seam：`packages/reporting/src/agent-projection-panel-view-model-builder.ts`
6. 当前 formal UI consumer 参考实现：`apps/cli/src/react-cli/views/agent-projection-panel.tsx`

## Verification

本入口的正式 smoke 由以下命令承接：

1. `pnpm run build`
2. `pnpm run check:desktop-entry-smoke`
3. `pnpm run release:verify-local`
4. `pnpm run release:verify-cleanroom-local-install` 仍只验证 CLI packaged-install surface，不可被当成 desktop installer proof。
