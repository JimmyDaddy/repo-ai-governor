# ACP Execution Bridge And Invoke Stream Confirm Cutover ADR

- Status: active
- Date: 2026-04-20
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.acp-execution-bridge-and-invoke-stream-confirm-cutover.v1`

## 1. Context

`runtime.agent-projection` 已经 formalize 了 `acp_exec` distinct transport truth、`acp_host_companion` carrier 与 host-facing distribution boundary，但当前 ACP path 仍停留在 readiness/bootstrap 层：

1. `CliAcpHostProtocol` 只承担 `probe` truth；`invokeStage`、`streamEvents`、`requestConfirmation` 仍是 fail-closed。
2. `AgentRouteRunner` 当前继续以 `invokeStage` 作为主要 dispatch owner；若把 `streamEvents` 强行提升为 primary owner，会破坏现有 runtime contract。
3. `repo-ai-governor/service-host` 与 `LocalOrchestrationServiceSidecarHost` 已证明 sidecar/runtime-service substrate 成立，但它们并不天然承担 ACP JSON-RPC client ownership。
4. `AgentConfirmationRequest` 目前只有 `prompt / metadata / deadlineAt`，缺少 ACP-native `toolCall / options` 最小语义，因此 `session/request_permission` 不能被误写成“天然一一对应”的既成事实。

因此，本轮 promotion 的关键问题不再是“是否继续承认 ACP host-facing transport”，而是“如何把 `acp_exec` 从 readiness-only transport 继续推进为 bridge-backed executable transport，同时保持 transport truthfulness、owner 分层与 rollout-gated support boundary”。

## 2. Decision

1. `runtime.agent-projection` 正式把 `acp_exec` 从 readiness-only transport 推进为 bridge-backed executable transport；`acp_exec` 与 `cli_exec` 继续保持并列 canonical truth，不得 alias，也不得 same-surface fallback。
2. `CliAcpHostProtocol` 继续作为 `AgentProtocol` entrypoint，但 ACP execution ownership 必须显式拆分到独立 runtime owner，而不是继续塞回单个 protocol 类或 sidecar host：
   - `CliAcpTransportClientRuntime`
   - `CliAcpCapabilityDiscoveryRuntime`
   - `CliAcpSessionRuntime`
   - `CliAcpPromptTurnRuntime`
   - `CliAcpHostOperationRuntime`
3. `repo-ai-governor/service-host` 与 `LocalOrchestrationServiceSidecarHost` 继续只承担 bootstrap/runtime-service substrate；它们可以为 ACP execution bridge 提供 host handoff 与 sidecar service 基础，但不得被写成 ACP protocol transport client 本身。
4. `invokeStage` 必须保持 self-sufficient；`streamEvents` 可以启动流式执行，也可以附着到同一次共享 turn execution，但不能反向要求“先跑 `streamEvents` 才能执行 stage”。共享执行由 transport-scoped invocation state 与 `acp_invocation_key` 负责收敛。
5. ACP-local execution state 继续保持 additive、transport-scoped 与 non-canonical：
   - `acp_session_id`
   - `acp_invocation_key`
   - `terminal_ids[]`
   - `permission_request_ids[]`
   这些事实不得覆盖 minimum `session_id`，不得进入 `AgentSessionRegistry` canonical truth，也不得编码到 `ProviderContinuationHandle`。
6. `requestConfirmation` 只有在 active ACP tool-call context 存在、且当前 request facts 能稳定派生 permission correlation/options 时，才允许桥接到 `session/request_permission`；否则必须 fail-closed，或等待 additive structured fields 在 rollout phase A 被正式补齐。
7. `terminal/*` 与 `fs/*` bridge 必须 capability-gated、route-aware 且 fail-closed。缺失 ACP capability 时只允许诚实降级或不可用，不得静默回落到 local `cli_exec`。
8. packaged clean-room execution、runtime-service execution evidence、外部 interoperability rehearsal 与 adopter-facing support wording uplift 继续后置到 `project-115-acp-execution-bridge-rollout` 的 follow-up rollout，不在本轮 docs promotion 中宣称完成。

## 3. Consequences

1. `acp_exec` 可以进入真实执行方向，而不会制造第二套 host runtime truth 或把 ACP 伪装回 `cli_exec`。
2. ACP execution path 将以 capability/session/turn/host-operation 的分层 owner 方式推进，避免 `CliAcpHostProtocol` 演化成新的 God object。
3. `invokeStage` 与 `streamEvents` 的共享 turn execution 成为 formal runtime boundary，后续 implementation 必须显式处理双执行风险，而不是靠调用顺序碰运气。
4. confirmation bridge 仍保持诚实边界：在 additive request facts 尚未补齐前，`session/request_permission` 只是受限 cutover，而不是已经完整对齐的通用 bridge。
5. `project-115` 获得固定 rollout ownership：phase A 先收 contract/runtime decomposition，后续再进入 executable baseline、bridge hardening、clean-room evidence 与 optional external interoperability rehearsal。

## 4. Source Anchors

1. `.repo-ai-governor/draft/acp-execution-bridge-and-invoke-stream-confirm-cutover-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-003-phase-f-secure-authoring-and-user-settings/review/approved_solution_review_acp-execution-bridge-and-invoke-stream-confirm-cutover.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
8. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md`
