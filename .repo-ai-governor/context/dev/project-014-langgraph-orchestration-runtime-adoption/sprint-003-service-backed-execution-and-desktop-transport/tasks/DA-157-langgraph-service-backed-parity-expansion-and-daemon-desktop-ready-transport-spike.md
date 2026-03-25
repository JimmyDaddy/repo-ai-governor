# DA-157 LangGraph service-backed parity 扩围与 daemon/desktop-ready transport spike

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-157`
- Produced By: `TK-157`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 当前结论

当前判定：`completed`。

`TK-157` 已完成两类正式收口：

1. `LangGraph` cutover parity 已扩围到 service-backed path，并由 CLI / service summary / event stream 三个正式输出面共同给出证据。
2. daemon/desktop-ready transport spike 已收敛为“provider seam + transport-neutral host descriptor”基线；下一步唯一推荐候选是 `sidecar + ipc`，`daemon + http` 仅保留为后续选项。

## 2. 当前已成立的比较基线

1. `DA-145` 已冻结 parity 目标：比较 facade/service 对外 contract、artifact/audit/review/ledger 和 lifecycle 终态，不比较 backend 内部日志。
2. `DA-154` 已冻结 transport-neutral streaming contract：
   - `serviceHostKind`
   - `serviceTransportKind`
   - `latestEventSequence`
   - `nextCursor`
   - `subscribeExecution(cursor)`
3. `DA-155` 已冻结 service-owned `execution list / HITL / recovery` 响应语义：
   - `executionSummary`
   - `artifactPath / latestArtifactPath`
   - `MEMORY_SESSION_INVALID_STATUS` fail-closed 语义

## 3. service-backed parity 比较面（冻结）

`TK-157` 的正式 parity compare 现至少覆盖以下 6 个维度：

1. CLI `pretty/plain/json` 输出字段是否保持稳定。
2. `execution list / subscribeExecution / submitHitlDecision / recoverExecution` 的 service-backed DTO 是否保持稳定。
3. `checkpointPath / checkpointSource / recovery result / nextCursor` 是否与 service owner summary 一致。
4. `artifact.ready`、HITL receipt、review/recovery 生命周期是否与 sprint-002 的 canonical source 行为一致。
5. `blocked / interrupted / failed / completed` 终态语义是否不漂移。
6. 差异是否仅来自 transport host 形态，而不是治理语义变化。

## 4. daemon / desktop-ready transport spike（冻结）

当前最小 host/transport 组合已经可以明确成 3 档：

1. 当前已实现基线：
   - `serviceHostKind=embedded`
   - `serviceTransportKind=in_process`
2. daemon/desktop-ready 候选一：
   - `serviceHostKind=sidecar`
   - `serviceTransportKind=ipc`
   - 适合作为 Electron/Tauri 本地 sidecar
3. daemon/desktop-ready 候选二：
   - `serviceHostKind=daemon`
   - `serviceTransportKind=http`
   - 适合作为长期驻留本地服务，但当前不进入产品化

当前结论是：`sidecar + ipc` 应作为下一步最小候选，`daemon + http` 只保留为 follow-up option，不在本 sprint 内承诺实现。

## 5. 最终实现结果

### 5.1 service-backed parity compare

1. `run` 的 CLI 正式输出已与 service-owned execution summary / event stream 对齐：
   - `orchestration_status`
   - `serviceHostKind / serviceTransportKind`
   - `latestEventSequence / nextCursor`
   - `checkpointPath / checkpointSource / recoveredNextNodeIds`
2. `review / review-verify` 的 CLI 正式输出已补齐 `serviceHostKind / serviceTransportKind`，并和 service summary / event stream 的 `latestArtifactId / latestArtifactPath` 回链一致。
3. parity 证据来自正式对外 contract，而不是 backend 内部日志：
   - CLI `details/artifacts`
   - service `getExecution/listExecutions`
   - service `subscribeExecution`

### 5.2 daemon / desktop-ready transport spike

1. `CliOrchestrationServiceRuntime` 不再硬编码依赖 `embedded shell` 具体类，而是收敛到 provider seam。
2. 通过 provider seam，已用单测证明同一 client/runtime contract 可以承载：
   - `sidecar + ipc`
   - `daemon + http`
3. 当前结论仍保持：
   - 默认基线：`embedded + in_process`
   - 下一步最小产品化候选：`sidecar + ipc`
   - `daemon + http`：只作为 follow-up option，不进入当前 rollout 承诺

### 5.3 legacy comparison path 约束

1. `legacy runtime` comparison baseline 仅保留在 `ProcessRuntimeFacade` 迁移期，不得扩张到 service/client 层形成长期 dual-runtime mode。
2. sprint-003 的 service-backed parity 已由正式 CLI/service contract 证明，因此不再需要新增 service-level legacy comparison path。
3. 后续只有在真实 graph execution backend 与 `sidecar + ipc` host 同时具备 smoke 证据后，才允许考虑继续收窄 facade-level comparison path。

## 6. rollout 约束

1. 未来 desktop 入口只能消费 `orchestration-service-client` DTO/event contract，不得旁路 runtime internals。
2. `sidecar + ipc` 是唯一推荐的下一步 host/transport 候选。
3. `daemon + http` 在没有本地守护进程治理、权限与生命周期约束前，不进入实现承诺。
4. 任何后续 parity 验证必须继续比较正式产物，不得回退到内部日志比对。

## 7. 证据路径

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-145-langgraph-phase-0-spike-dual-runtime-parity-and-rollout-plan.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-002-langgraph-phase0-spike-and-service-shell/tasks/DA-152-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`
3. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/DA-154-orchestration-service-client-transport-neutral-streaming-and-desktop-ready-dto-hardening.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/DA-155-service-backed-hitl-recovery-and-execution-list-contract-closure.md`
5. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/DA-156-cli-run-review-hitl-recovery-to-orchestration-service-client-cutover.md`
6. `apps/cli/src/runtime/orchestration-service-runtime.ts`
7. `apps/cli/test/runtime/orchestration-service-runtime.test.ts`
8. `apps/cli/test/cli-governance-runtime.integration.test.ts`
