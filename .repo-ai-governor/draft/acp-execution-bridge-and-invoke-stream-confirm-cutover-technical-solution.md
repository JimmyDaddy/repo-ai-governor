# ACP Execution Bridge And Invoke Stream Confirm Cutover Technical Solution (Draft)

- Status: draft
- Date: 2026-04-19
- Owner: AI-Agent
- Scope: `runtime.agent-projection / acp_exec 从 readiness + host bootstrap 进入真实可执行 invoke/stream/confirm cutover / service-host-sidecar backed ACP execution bridge`
- Target Modules:
  - `runtime.agent-projection`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
  - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`
  - `apps/cli/src/runtime/cli-acp-host-protocol.ts`
  - `apps/cli/src/runtime/cli-acp-host-companion-runtime.ts`
  - `packages/adapter-sdk/src/agent-protocol.abstract.ts`
  - `packages/adapter-sdk/src/agent-route-runner.ts`
  - `packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts`
  - `https://agentclientprotocol.com/protocol/session-setup`
  - `https://agentclientprotocol.com/protocol/tool-calls`
  - `https://agentclientprotocol.com/protocol/file-system`
  - `https://agentclientprotocol.com/protocol/terminals`
  - `https://paseo.sh/changelog`

## 1. 背景与问题

当前仓库已经把 ACP formalize 到“显式 transport truth + host bootstrap/readiness companion”这一层，但还没有进入真实执行层。

当前真实现状可以概括为：

1. `acp_exec` 已经是正式 transport truth，但仍被要求与 `cli_exec` 严格分离，不能 alias，也不能静默 fallback。
2. `CliAcpHostProtocol` 目前只实现了 `probe`；`invokeStage`、`streamEvents`、`requestConfirmation` 全部 fail-closed。
3. `packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts` 仍是 internal no-op seam，尚未成为 host-facing execution bridge。
4. `host export / verify / pack` 与 `repo-ai-governor/service-host` 已经形成了 evidence-backed host bootstrap path，但该路径当前证明的是 host distribution / runtime-service readiness，不是 ACP turn execution truth。

这导致仓库当前对 ACP 的支持口径仍停留在：

1. `connect / doctor / verify` 可以诚实投影 `transport_kind=acp_exec`。
2. `acp_host_companion` 可以表达 host readiness、distribution boundary 与 clean-room verification summary。
3. 同一 surface 的真实执行仍然无法通过 ACP 完成 `invoke / stream / confirm / cancel`。

对本项目来说，这已经成为一个实际产品缺口。PRD 主线要求“让用户在自己的仓库中接入任意 AI 工具，并按统一流程做多 Agent 治理编排”。如果 `acp_exec` 长期只停在 readiness 层，它就无法从“受支持的宿主 companion surface”继续演进到“可被 runtime 真正调度的 transport surface”。

同时，外部 ACP 官方文档已经定义了可直接映射本仓库 AgentProtocol 的关键能力：

1. `session/new` / `session/load` / `session/prompt` / `session/cancel`
2. `session/request_permission`
3. `fs/read_text_file` / `fs/write_text_file`
4. `terminal/create` / `terminal/output` / `terminal/wait_for_exit` / `terminal/kill` / `terminal/release`

外部生态也开始出现 ACP consumer surface。Paseo 已支持把 ACP-compatible agent 作为 provider profile 接入。这说明 ACP 对本项目的价值已经不只是“内部预留 seam”，而是一个值得推进到真实可执行面的互操作边界。

## 2. 目标

1. 将 `acp_exec` 从“只可 probe/readiness 投影”推进为可真实执行的 `AgentProtocol` transport。
2. 在不破坏现有 `cli_exec` canonical truth 的前提下，为 `invokeStage`、`streamEvents`、`requestConfirmation`、`cancel` 建立 ACP bridge。
3. 复用现有 `repo-ai-governor/service-host` 与 `LocalOrchestrationServiceSidecarHost` 作为 canonical host bootstrap / sidecar substrate，而不是另起一套平行宿主运行时。
4. 明确 ACP session、permission、terminal、filesystem truth 在本仓库中的 carrier、缓存、生命周期与 fail-closed 语义。
5. 为后续 clean-room execution、packaged distribution execution 与外部 client interoperability 验证提供可 review 的 phased rollout blueprint。

## 3. 非目标

1. 不把 ACP path 重新解释成 `cli_exec` 成功结果。
2. 不把 `acp_exec` promotion 成新的默认 transport。
3. 不在本方案中推翻现有 `runtime.orchestration`、`AgentRouteRunner` 或 `AgentDescriptor` 的所有权边界。
4. 不把 `service-host` 替换为新的独立 daemon / relay / cloud control plane。
5. 不把 Paseo 引入为仓库核心依赖或主运行时；Paseo 只作为 optional external interoperability surface。
6. 不在本方案中直接 uplift adopter-facing support wording；support truth 仍需 rollout evidence 收口。

## 4. 现状与约束

1. 现有 formal docs 已明确：`acp_exec` 与 `cli_exec` 并列存在，不是 alias，不允许 same-surface fallback。
2. `AgentProtocolContract` 的 runtime minimum surface 已经稳定为：
   - `probe`
   - `invokeStage`
   - `streamEvents`
   - `requestConfirmation`
   - `cancel`
3. `AgentRouteRunner` 当前按 `probe -> invokeStage` 走路由，而 `session-main-supervisor` 等 consumer 会进一步消费 `streamEvents` 与 confirmation semantics。
4. `runtime.agent-projection` 已经拥有 `acp_host_companion` additive carrier，但这些 ACP-local ids 不能进入 `AgentSessionRegistry` canonical truth，也不能写进 `ProviderContinuationHandle`。
5. `service-host` 发布面与 `LocalOrchestrationServiceSidecarHost` 已经是当前受支持的宿主 bootstrap import path；任何 ACP 执行 cutover 都应优先复用这条路径。
6. ACP 官方文档要求在执行 `terminal/*`、`fs/*`、`session/load` 等能力前先完成 initialization/capability discovery；缺少 capability 时必须 fail-closed。
7. 当前仓库对 ACP 的 clean-room 证据覆盖的是 host export/pack/verify，不是 `session/prompt -> session/update -> cancel/permission/terminal/file` 的真实 turn execution。
8. 外部 ACP 文档与 Paseo 资料只能作为 supplemental evidence；仓库内结构化真值与现有 ADR/contract 仍优先。

## 5. 方案选项与对比

### 5.1 方案 A：继续维持 readiness-only ACP

1. 做法：保留当前 `CliAcpHostProtocol` 只做 `probe` 和 companion projection，执行仍全部 fail-closed。
2. 优点：
   - 风险最低
   - 不影响现有 runtime truth
3. 缺点：
   - `acp_exec` 永远无法进入真实 runtime 调度
   - host bootstrap 与 transport truth 之间长期断层
   - 外部 ACP ecosystem 无法作为执行互操作面验证本项目

### 5.2 方案 B：在现有 `service-host` / sidecar 之上引入 ACP execution bridge

1. 做法：
   - 保持 `CliAcpHostProtocol` 作为 transport entrypoint
   - 在其下新增 session / prompt / permission / terminal / filesystem bridge runtimes
   - 执行 path 复用现有 `repo-ai-governor/service-host` 与 sidecar bootstrap truth
2. 优点：
   - 与现有 host bootstrap contract 一致
   - 最符合当前 ACP formalization 与 support boundary
   - 不需要重新发明第二套宿主运行时
3. 缺点：
   - 需要补足 session cache、shared invocation、cancel/terminal cleanup 等中层 runtime
   - contract 与 clean-room execution gates 会明显扩张

### 5.3 方案 C：单独实现一套独立于 `service-host` 的 ACP daemon/runtime

1. 做法：绕过现有 service-host / sidecar，单独为 ACP 建 daemon、transport cache、command execution seam。
2. 优点：
   - 理论上隔离更强
   - 可以自由设计新的协议栈
3. 缺点：
   - 与现有 host export / verify / pack / service-host truth 重叠严重
   - 会制造第二套宿主运行时事实源
   - 与当前产品边界和仓库 formal docs 不一致

### 5.4 方案 D：把 ACP execution 包回 `cli_exec`

1. 做法：ACP execution bridge 存在，但对外仍宣称 `cli_exec`。
2. 优点：
   - 表面接入成本低
3. 缺点：
   - 直接违反现有 ADR
   - 破坏 transport truthfulness
   - 让 support/docs/diagnostics 全部失真

### 5.5 对比结论

推荐方案 B。

它既能把 ACP 推进到真实执行面，又能复用现有 `service-host` / sidecar bootstrap truth，并且保持与现有 `acp_exec` formalization 一致。方案 A 不足以满足产品目标，方案 C 会制造平行 runtime，方案 D 与当前治理边界直接冲突。

## 6. 推荐方案

1. 保留 `CliAcpHostProtocol` 作为 `acp_exec` 的唯一 adapter-facing protocol entrypoint。
2. 将当前 ACP 方向从“probe-only protocol”升级为“bridge-backed executable protocol”，但 bridge 必须站在现有 `service-host` / sidecar 之上，而不是另起宿主运行时。
3. 为 `acp_exec` 建立 transport-scoped execution runtime，显式承接：
   - session initialization / session reuse
   - prompt turn execution
   - session update streaming
   - permission request / response mapping
   - terminal/file operation bridging
   - cancellation and terminal cleanup
4. `AgentDescriptor.selected_transport=acp_exec` 与 `acp_host_companion` 继续保持 canonical separation；execution 成功不得回写成 `cli_exec`。
5. 对外部生态，优先把 Paseo 视为 optional ACP interoperability target，而不是内核依赖。

## 7. 核心设计与契约影响

### 7.1 总体分层

建议把 ACP execution cutover 分为六个明确 owner，而不是继续把所有逻辑塞进单个 `CliAcpHostProtocol`：

1. `CliAcpHostProtocol`
   - 继续作为 `AgentProtocol` entrypoint
   - 只负责 method-level orchestration 与 runtime wiring
2. `CliAcpTransportClientRuntime`
   - 负责建立与 ACP-compatible agent 的真实 transport 连接
   - 默认 owner 是 stdio subprocess client；如宿主后续提供等价 transport，也必须保持同一 contract
   - 不允许把 `LocalOrchestrationServiceSidecarHost` 本身误写成 ACP transport client
3. `CliAcpCapabilityDiscoveryRuntime`
   - 负责 ACP initialization、client capability snapshot、session-load support discovery
   - 统一输出 probe-ready capability profile
4. `CliAcpSessionRuntime`
   - 负责 `session/new`、`session/load`、session reuse policy 与 transport-scoped session cache
5. `CliAcpPromptTurnRuntime`
   - 负责 `session/prompt`、`session/update` 到 `AgentInvokeStageResult` / `AgentStreamEvent` 的映射
6. `CliAcpHostOperationRuntime`
   - 负责 `session/request_permission`、`terminal/*`、`fs/*` 与 cancellation cleanup

这样可以保持：

1. `CliAcpHostProtocol` 不变成 God object
2. capability / session / turn / host operations 各自有独立 test surface
3. 后续 promotion 时可以把 contract 变化定位到 `runtime.agent-projection` 一个模块中收口

### 7.2 AgentProtocol 方法映射

建议采用下表作为 canonical bridge mapping。这里必须保留当前仓库的一个事实：`AgentRouteRunner` 仍以 `invokeStage` 为主要 dispatch owner，因此 ACP bridge 不能要求“只有先调用 `streamEvents` 才能执行”；两条方法必须都能独立触发或附着到同一次共享 turn execution。

| Repo Contract | ACP Mapping | Notes |
| --- | --- | --- |
| `probe` | `initialize` + capability snapshot + evidence companion lookup | capability 不满足时保持 `degraded/unavailable`，不得假成功 |
| `invokeStage` | `session/new` or `session/load` + `session/prompt` + final turn aggregation | 在当前 runtime 下必须保持 self-sufficient；若同一 stage 已有 active stream，则复用同一次 ACP turn，不得重复发 prompt |
| `streamEvents` | attach to the shared `session/prompt` turn and relay `session/update` notifications | 可先启动流式执行，也可附着到由 `invokeStage` 启动的同一 turn；不得强依赖调用顺序 |
| `requestConfirmation` | `session/request_permission` when an active ACP tool-call context exists | 当前 repo contract 没有 ACP-native `toolCall/options` minimum fields，因此 promotion 前必须补齐 addtive mapping 或收窄适用范围 |
| `cancel` | `session/cancel` + optional `terminal/kill` + `terminal/release` | cleanup 必须 transport-scoped，不得污染 shared session truth |

### 7.3 Session 与 invocation 模型

建议引入 transport-scoped、非 canonical 的 ACP session/invocation state：

1. `acp_session_id`
   - 只属于 `acp_exec`
   - 可进入 `acp_host_companion` 或 in-flight execution state
   - 不覆盖 minimum `session_id`
2. `acp_invocation_key`
   - 建议由 `execution_id + stage_id + selected_surface + selected_transport` 组成
   - 用于 `invokeStage` 与 `streamEvents` 共享同一次 prompt turn
3. `terminal_ids[]`
   - 仅保留在 transport-scoped execution state
   - execution 结束或 cancel 后必须显式 `release`
4. `permission_request_ids[]`
   - 只用于 turn 内 correlation
   - 不进入 lifecycle registry、AgentSessionRegistry 或 continuation handle

默认 reuse 策略建议如下：

1. 若 ACP agent 宣告支持 `loadSession`，同一 execution lane 可优先复用已存在 ACP session。
2. 若不支持 `loadSession`，则每次 stage 新建 `session/new`，并把 session reuse 能力在 diagnostics 中诚实降级。
3. 不允许因为 session reuse 失败就自动切回 `cli_exec`。

### 7.4 Permission / HITL 映射

ACP 官方 `session/request_permission` 与本项目的 confirmation gate 存在方向上的天然映射关系，但当前 repo contract 还没有一一对应。`AgentConfirmationRequest` 现在只有 `prompt / metadata / deadlineAt`，并没有 ACP permission request 直接需要的 `toolCall` 与 options 语义，因此本方案必须先把这一点说清楚。

推荐把 `requestConfirmation` 的 ACP cutover 分成两层：

1. 当前阶段的最小 cutover：
   - 只在存在 active ACP tool-call context 时支持 `session/request_permission`
   - `AgentConfirmationRequest.metadata` 必须能派生出 tool-call correlation 与允许选项
2. 后续 promotion 前的 contract hardening：
   - 若现有 `metadata` 无法稳定承载 ACP permission facts，就需要为 confirmation bridge 新增 additive structured fields
3. 执行路径：
   - runtime 产出 confirmation request
   - ACP bridge 在 active turn 内发出 `session/request_permission`
   - 用户在宿主 surface 完成 allow / reject
   - bridge 将结果映射回 `AgentConfirmationResult`

这里要保持两个边界：

1. ACP permission 只是 transport-scoped user decision carrier，不替代本项目 policy engine
2. policy 是否允许进入 confirmation，仍由本项目策略层决定；ACP 只承接 transport execution

### 7.5 Terminal / filesystem 映射

对于 coder/reviewer/verifier 等 coding-heavy 路由，建议把以下 ACP client capabilities 视为 route-level execution-ready baseline，而不是对所有 `acp_exec` 路由一刀切的全局 minimum：

1. `terminal=true`
2. `fs.readTextFile=true`
3. `fs.writeTextFile=true`

落地原则：

1. 命令执行统一走 `terminal/create` / `terminal/output` / `terminal/wait_for_exit`
2. 超时语义统一走 `terminal/kill` + `terminal/output` + `terminal/release`
3. 文件读写统一走 `fs/read_text_file` / `fs/write_text_file`
4. capability 缺失时必须 fail-closed 或明确降级；不得悄悄回落到本地 `cli_exec`

### 7.6 与现有 service-host 的关系

推荐将 `repo-ai-governor/service-host` 与 `LocalOrchestrationServiceSidecarHost` 继续视为 ACP 执行 cutover 的 canonical bootstrap / runtime-service substrate，而不是直接把 sidecar host 视为 ACP protocol client 本身：

1. `host export / verify / pack` 继续负责把宿主可消费资产与 sidecar handoff 部署到目标 surface
2. ACP execution bridge 建立在这条已验证的 runtime-service path 之上，但真实 ACP protocol loop 仍由 `CliAcpTransportClientRuntime` 负责
3. `LocalOrchestrationServiceSidecarHost` 继续承担 `sidecar + ipc` orchestration substrate，不直接承担 ACP JSON-RPC client ownership
4. 不新增平行 daemon / relay / sidecar brand

换句话说：

1. host bootstrap 负责“把 repo-ai-governor sidecar/asset 放到可被宿主消费的位置”
2. sidecar/runtime-service substrate 负责提供本地 execution/service ownership 与 host handoff
3. ACP execution bridge 负责“在该已存在宿主通道之上，通过独立 ACP transport client 承接真实 ACP session/prompt/permission/terminal/file execution”

### 7.7 诊断与 support truth

`probe` / `doctor` / `verify` 需要从“只报告 readiness summary”升级为“可解释执行 readiness”。建议新增但保持 additive 的事实：

1. `acp_execution_readiness_status`
2. `missing_acp_capabilities[]`
3. `session_reuse_support`
4. `turn_streaming_support`
5. `permission_bridge_support`
6. `terminal_bridge_support`
7. `filesystem_bridge_support`

这些字段仍是 additive diagnostics，不升级为 onboarding minimum fields。

### 7.8 Paseo 互操作边界

Paseo 的 `extends: "acp"` 更适合作为外部验证面，而不是仓库核心依赖。建议在本方案中把它定义为：

1. non-blocking interoperability target
2. clean-room execution 之后的 follow-up evidence surface
3. 用来证明本项目 ACP execution bridge 具备 client-agnostic compatibility

不建议在本方案中：

1. 引入 Paseo 源码作为依赖
2. 围绕 Paseo 调整本项目主运行时 ownership
3. 把 Paseo 的 daemon / app surface 作为本项目 canonical truth

## 8. 风险与权衡

1. ACP execution bridge 会显著扩大 runtime contract、host runtime、clean-room verification 与 release evidence 的范围。
2. 如果 `invokeStage` 与 `streamEvents` 各自触发一次 `session/prompt`，会造成双执行；因此必须引入 shared invocation store。
3. 如果 terminal/file capability 要求定义得过高，ACP surface 会长期停在 unavailable；定义得过低，又会制造半可用假象。
4. 如果 ACP-local ids 漏写到 `session_id` 或 continuation handle，会破坏既有 canonical truth。
5. 如果直接另起 ACP daemon，短期也许更自由，但会制造第二套宿主执行真值，后续维护成本更高。
6. Paseo 作为外部 consumer 虽然有价值，但它的行为模型和 release cadence 不由本仓库控制，因此只能作为 supplemental interoperability evidence。

## 9. 分阶段落地建议

1. Phase A：Contract and runtime decomposition
   - 补齐 `requestConfirmation -> session/request_permission` 的 contract gap 说明与 additive request facts
   - 明确 `CliAcpTransportClientRuntime` 是 ACP protocol transport owner，而不是 sidecar host 本身
   - 拆出 capability/session/turn/host-operation runtimes
   - 明确 `invokeStage / streamEvents / requestConfirmation / cancel` 的 ACP mapping
   - 加入 fake ACP client / fixture-backed contract tests
2. Phase B：Executable acp_exec baseline
   - 让 `CliAcpHostProtocol` 结束 probe-only 状态
   - 打通 `session/new`、`session/prompt`、`session/cancel`
   - 建立 shared invocation store，确保 `invokeStage` 与 `streamEvents` 在任意调用顺序下都不会双执行
3. Phase C：Terminal/filesystem/permission bridge hardening
   - 打通 `session/request_permission`
   - 打通 `terminal/*` 与 `fs/*`
   - 明确 capability-gated degrade / fail-closed semantics
4. Phase D：Source-checkout and packaged clean-room execution evidence
   - 在现有 ACP host export/pack/verify 基础上补 execution clean-room
   - 覆盖 `path/link/tgz` source-checkout 与 packaged distribution 场景
5. Phase E：External interoperability follow-up
   - 用 Paseo `extends: "acp"` 做 optional external validation
   - 仅在 execution clean-room 证据稳定后，再讨论 support wording uplift

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.acp-execution-bridge-and-invoke-stream-confirm-cutover`
2. 建议 `target_module_ids`：`runtime.agent-projection`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - 是否继续保持 `acp_exec` 与 `cli_exec` 的严格 truth separation
   - 是否复用了现有 `service-host` / sidecar 路径，而非另起宿主运行时
   - `invokeStage` 与 `streamEvents` 是否通过共享 execution state 避免双执行
   - `session_id`、`acp_session_id`、continuation handle 的边界是否清晰
   - `terminal/*`、`fs/*` 与 `session/request_permission` 是否被建模为 capability-gated bridge
   - Paseo 是否只被放在 interoperability evidence 的位置，而非内核依赖
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-execution-bridge-and-invoke-stream-confirm-cutover.md`
5. promotion 之前的必备证据建议：
   - fixture-backed ACP contract tests
   - source-checkout ACP execution slice
   - clean-room packaged ACP execution slice
   - failure-path verification：capability missing / permission reject / terminal timeout / session cancel
   - optional Paseo interoperability rehearsal
