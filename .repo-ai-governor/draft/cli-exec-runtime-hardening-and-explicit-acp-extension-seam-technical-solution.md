# CLI Exec Runtime Hardening And Explicit ACP Extension Seam Technical Solution (Draft)

- Status: draft
- Date: 2026-04-13
- Owner: AI-Agent
- Scope: `runtime.agent-projection / native cli_exec transport hardening / explicit ACP extension seam / cross-adapter process runtime convergence`
- Target Modules:
  - `runtime.agent-projection`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/transport-selection-authority-and-strict-transport-routing.md`
  - `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
  - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
  - `apps/cli/src/runtime/adapter-routing-runtime.ts`
  - `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts`
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
  - Supplemental external evidence: `https://github.com/RAIT-09/obsidian-agent-client/tree/cbe4712a5f390e8390a326e21464598a48a6c65f`

## 1. 背景与问题

当前仓库已经把 `baseline / cli_exec / remote_api` 作为正式 transport truth，并明确要求同一 surface 内禁止静默 `remote_api <-> cli_exec` 自动切换。因此，任何对 `cli_exec` 的优化都必须满足一个前提：

`优化的是 native cli_exec 的实现质量，而不是把别的协议链路偷偷塞进 cli_exec 的语义里。`

结合当前实现与外部调研，可观察到 4 个事实：

1. `Codex`、`Claude Code`、`GitHub Copilot` 目前都在各自 adapter 内直接 `spawn(...)`，process launch、timeout、abort、stdout/stderr 聚合、partial-output preservation 与进程树清理逻辑存在重复实现。
2. 当前共享的 `AgentCliExecOperationsRuntime` 主要解决 retry/backoff、错误细节收集与敏感信息脱敏，还没有统一 process lifecycle 与跨平台 launch seam。
3. `runtime.agent-projection` 已正式拥有 invoke-liveness、transport selection authority、adapter health/probe 与 continuation seam；这意味着 `cli_exec` 的改造应优先作为该模块内部收敛，而不是旁路出第二套 host-local truth。
4. `obsidian-agent-client` 的 ACP 实现展示了若干可借鉴模式，例如协议层隔离、统一事件通道、权限队列、终端管理和跨平台进程准备；但它依赖额外的 ACP adapter 进程、`ndJsonStream + ClientSideConnection` 握手以及 `unstable_*` session API，更适合作为“未来显式扩展 seam”参考，而不是当前 `cli_exec` 的替代实现。

因此，本 draft 要解决的问题不是“要不要切 ACP”，而是：

1. 如何在不改变 `cli_exec` canonical truth 的前提下，收敛当前三条 native CLI process runtime。
2. 如何把可直接复用的 ACP 客户端模式抽象为未来可选能力，而不是把当前 runtime 绑死到 ACP adapter 生态。
3. 如何让后续如果真的引入 ACP，也仍然符合现有 transport truth、fail-closed 与 evidence-gated public support 约束。

## 2. 目标

1. 为 `codex`、`claude-code`、`github-copilot` 抽出共享的 native `cli_exec` process runtime，统一 launch / timeout / cancel / partial output / diagnostics 行为。
2. 保持现有 `cli_exec`、`remote_api`、continuation 与 onboarding/projection contract 的 canonical truth 不变，不引入隐式 ACP fallback。
3. 为未来显式、可选、evidence-gated 的 ACP transport 或 host-native ACP surface 预留隔离 seam，使 richer session / permission / terminal 能力可以在不污染当前 `cli_exec` 的情况下增量接入。
4. 降低三条 adapter 在跨平台进程处理、错误归因与 liveness 信号上的漂移成本。

## 3. 非目标

1. 不把当前 `cli_exec` 直接替换为 ACP adapter 链路。
2. 不改写 `baseline / cli_exec / remote_api` 的现有 transport 选择语义，也不引入同一 surface 内的自动 failover。
3. 不在本方案中承诺 ACP 已成为公开支持路径；若未来引入，仍需独立 evidence gate 与 support-matrix / playbook 更新。
4. 不重写 `provider continuation`、`session.main` lane lifecycle 或 shared-session truth；ACP session/resume/fork 不能反向取代现有 continuation contract。
5. 不在本方案里直接定义新的 host product surface 或 distribution contract；这些若受影响，应通过 `runtime.governance-clients` follow-up 承接。

## 4. 现状与约束

1. `runtime.agent-projection` 已明确拥有 transport truth、invoke-liveness 和 adapter-facing continuation seam；`selected_transport` 与 fail-closed 语义不能被 host 便利性突破。
2. `Codex`、`Claude Code`、`GitHub Copilot` 当前在 adapter 内各自维护命令参数拼装之后的 `spawn(...)`、stdout/stderr 聚合、`SIGTERM` timeout 中断等逻辑；共享面只覆盖 retry/backoff/redaction，没有覆盖 process runtime 自身。
3. `Codex cli_exec` 当前甚至比另外两条 adapter 更进一步，已经在单 adapter 内实现了 `graceful_interrupting / hard_terminating`、dual-stage terminate fuse 与 partial-output preservation，这说明仓库已经证明这类 runtime 能力值得正式抽象，而不是继续复制。
4. `Claude Code` 与 `GitHub Copilot` 当前的 native `cli_exec` 路径仍主要依赖“单次 `spawn + timeout + SIGTERM`”模式，进程树清理、Windows/WSL shell wrapping、stderr 诊断聚合与 output retention 还没有统一 owner。
5. 外部 ACP 参考仓库的价值主要体现在：
   - 将 ACP SDK imports 严格隔离在单独层内；
   - 用统一事件通道承接消息、权限、终端与错误；
   - 通过终端/权限 manager 把交互式能力从主 client 中拆出；
   - 对 Windows/WSL/path/shell wrapping 与进程树清理有更强的 host-aware 处理。
6. 但 ACP 参考仓库不适合作为当前 `cli_exec` 直接替代物，因为：
   - 它要求用户安装 ACP adapter，而不是直接调用原生 CLI；
   - 它引入额外进程与 JSON-RPC/NDJSON 握手时延；
   - 它依赖 `unstable_listSessions / unstable_resumeSession / unstable_forkSession`；
   - 一旦我们把它偷偷包进当前 `cli_exec`，就会破坏现有 `transport selection authority` 的 truthful 表达。
7. 受 `CS-027` 约束，本次收敛不能把 `adapter-routing-runtime` 或任一 adapter 继续膨胀为“命令解析 + process runtime + transport diagnostics + host protocol abstraction”四合一对象；需要把共享 runtime 与 adapter-specific parser/command spec 分层。

## 5. 方案选项与对比

### 5.1 方案 A：用 ACP adapter 链路直接替换当前 native `cli_exec`

1. 做法：为 `codex`、`claude-code` 等 surface 改为启动 ACP adapter，通过协议层拿到消息、权限、终端、session 管理能力。
2. 优点：
   - 天然具备 richer session / permission / terminal 语义。
   - host-facing 交互能力更强，适合未来桌面类产品。
   - 可以直接复用 ACP 生态已有客户端模式。
3. 缺点：
   - 这不再是当前意义上的 native `cli_exec`，会引入新的 adapter 依赖与额外握手成本。
   - 现有 `cli_exec` smoke、liveness、support matrix、verify truth 都需要重写。
   - ACP adapter 并不天然等价于每个原生 CLI 的真实能力边界，存在 persona / feature drift。
   - 会迫使仓库在 evidence 尚未充分时，把一个新的协议链路伪装成现有 canonical transport。

### 5.2 方案 B：保留 native `cli_exec` 为 canonical transport，抽出共享 process runtime，并为未来显式 ACP 扩展预留隔离 seam

1. 做法：
   - 新增共享 `AgentCliExecProcessRuntime`（命名可在实现期再定稿），只负责 native CLI 进程生命周期与跨 adapter 的通用 launch 行为；
   - adapter 保留各自的 command spec、参数构造、输出解析、capability truth 与 transport-specific contract；
   - 若未来引入 ACP，只能通过新的显式 transport（推荐命名 `acp_exec`）或新的 host-native surface 进入，不能复用 `cli_exec` 名义。
2. 优点：
   - 立即解决当前最实际的重复问题，且与现有 `cli_exec` truth 完全兼容。
   - 能把 `Codex` 已经证明有效的 hard-timeout / partial-output / liveness 模式复用到其他 adapter。
   - 为未来 richer host-facing transport 留出边界，但不把 ACP 风险提前引入当前主线。
   - 验证成本清晰：Phase A/B 只需证明“native `cli_exec` 行为更一致”，不需要同时证明“ACP protocol path 已正式可用”。
3. 缺点：
   - 短期仍会同时存在 native `cli_exec` 与未来 ACP 扩展两类实现。
   - 需要额外设计“共享 runtime 与 adapter-specific parser”的接口分层，否则容易提取失败。

### 5.3 方案 C：继续按 adapter 局部修补当前 `spawn(...)` 实现

1. 做法：保持现状，只在各 adapter 中各自补 Windows/timeout/diagnostics 问题。
2. 优点：
   - 单次改动窗口较小。
   - 不需要抽共享层。
3. 缺点：
   - 漂移会继续累积，跨 adapter 的行为难以保持一致。
   - 以后若引 ACP 或 host-native richer transport，仍要先清理一遍重复实现。
   - 很难把 `process tree kill`、stderr heuristics、partial-output retention、cross-platform command preparation 做成统一 contract。

### 5.4 对比结论

1. 方案 A 过早把“未来可选协议扩展”升级成“当前 canonical transport 替换”，风险过高。
2. 方案 C 不能解决仓库当前最明显的 runtime duplication 问题，也不利于后续演进。
3. 推荐采用方案 B：

`native cli_exec 继续作为当前真实 transport；先做共享 process runtime 收敛，再把 ACP 保留为未来显式 transport/seam。`

## 6. 推荐方案

1. 在 `runtime.agent-projection` / `adapter-sdk` 责任边界内新增一个共享 native CLI process runtime，统一：
   - child process spawn / exit / stderr rolling window
   - timeout / graceful interrupt / hard terminate
   - partial-output preservation
   - process/transport liveness timestamp capture
   - stdout/stderr retention policy
   - structured spawn/exit diagnostics
   - 可选的进程树终止策略（Unix process group / Windows taskkill）
   - 共享 lifecycle event / snapshot emission seam
2. 各 adapter 只保留三类差异化职责：
   - command resolution 与 argument construction
   - stdout/stderr parser 与 output normalization
   - capability matrix、probe truth、transport-specific continuation / unsupported semantics
3. 现有 `AgentCliExecOperationsRuntime` 保留为共享 retry/backoff/redaction 层；新增 runtime 负责 process lifecycle，本次不把两者硬塞回单类，避免职责再次膨胀。
4. Phase A/B 不新增新的 canonical transport value；`cli_exec` 仍然是当前 selected transport truth。
5. 若未来需要 ACP，必须显式建模为新的 transport 或新的 host-native surface，推荐默认名为 `acp_exec`，并满足：
   - 不与 `cli_exec` 共享同一 truth slot；
   - 不在失败时静默回落到 `cli_exec`；
   - 不把 ACP session identity 误写成 provider continuation truth；
   - 在 evidence gate 通过前，不升级 support-matrix / playbook 的公开支持口径。
6. 与现有 active solution 的关系：
   - 这是对 `technical-solution.transport-selection-authority-and-strict-routing` 的实现面补强，而不是重写其 truth；
   - 这是对 `technical-solution.api-key-remote-adapter-invocation` 的并行补足：前者 formalize `remote_api`，本方案 formalize `native cli_exec` runtime 收敛；
   - 这是对 `technical-solution.agent-invoke-liveness-and-timeout-governance` 的共享化 follow-up，但不改变其已批准的 liveness 语义。

## 7. 核心设计与契约影响

### 7.1 共享 native CLI process runtime

1. 新共享 runtime 不应直接消费“尚未解析的 command authoring”，而应消费一份 adapter 已定稿的 `resolved launch plan`：
   - `resolved_entrypoint`
   - `args`
   - `cwd`
   - `env`
   - `stdin_text`
   - `timeout_ms`
   - `graceful_terminate_grace_ms`
   - `output_retention_policy`
   - `process_tree_policy`
   - `shell_strategy`
   - `request_cancellation_mode`
2. `resolved launch plan` 的 owner 必须保持在 adapter 一侧：
   - adapter 负责 command resolution、shell wrapping 决策、entrypoint fallback 解释与 route-specific launch authoring；
   - shared runtime 只消费已经解析完的 launch plan，不再反向拥有 command resolution 或 host protocol abstraction；
   - `entrypoint_resolution / shell_wrapped / process_tree_policy` 这类 future diagnostics 也应从 launch plan + runtime execution evidence 机械投影，而不是在共享 runtime 内再次推断。
3. 共享 runtime 的终态输出可继续收敛为一份 `process result`：
   - `stdout`
   - `stderr`
   - `exit_code`
   - `signal`
   - `elapsed_ms`
   - `timed_out`
   - `aborted`
   - `hard_terminated`
   - `partial_output_preserved`
   - `spawn_error_code`
   - `stderr_tail`
4. 但为了真正收敛 `Codex` 现有的 liveness 语义，shared runtime 还需要显式提供一个 `lifecycle observer` seam，而不是只返回终态 `process result`：
   - `onLifecycleEvent(event)`：用于流式发出 `starting / running / transport_idle_suspect / semantic_stall_suspect / graceful_interrupting / hard_terminating / completed / failed / cancelled` 等共享状态迁移；
   - `onLifecycleSnapshot(snapshot)`：用于稳定带出 `last_transport_activity_at`、`last_semantic_progress_at`、`terminate_phase`、`suspect_reason_codes[]`、`partial_output_preserved` 等 contract-facing truth；
   - `markSemanticProgress()`：由 adapter parser 在识别到真实 assistant/tool/todo/command 语义推进时显式回灌，用于避免 shared runtime 误把原始字节流活动等同于 semantic progress。
5. 这样一来，shared runtime 负责统一：
   - process liveness / transport activity 时间戳
   - soft interrupt / hard terminate 状态机
   - partial-output checkpoint 与终止前快照保留
   - process result 与 lifecycle diagnostics 的结构化产出
6. adapter 则继续负责：
   - stdout/stderr parser
   - semantic-progress 判断与 `markSemanticProgress()` 触发
   - capability / route / continuation / projection truth
7. `Codex` 当前的 `graceful_interrupting / hard_terminating` 语义应变成共享 runtime 的公共事件源，而不是单 surface 特例；`Claude Code` 与 `GitHub Copilot` 只需对接同一 observer seam，而不是再各自复制 watchdog。
8. 进程树清理应借鉴 ACP 参考实现的 host-aware 思路：
   - Unix 上支持 detached process group + `process.kill(-pid)`；
   - Windows 上支持显式 `taskkill /T`；
   - 但这些能力只能作为 native runtime 的实现细节，不得改写 transport truth。

### 7.2 adapter-specific ownership 保持不变

1. `Codex` 继续拥有 `codex exec --json` 输出解析与 repository-review 特殊命令入口。
2. `Claude Code` 继续拥有 `--print --output-format text --no-session-persistence` 等参数策略。
3. `GitHub Copilot` 继续拥有 `--allow-all-tools`、JSON 输出与 current cancellation truth。
4. adapter 负责产出 `resolved launch plan`，包括：
   - `resolved_entrypoint`
   - `shell_strategy`
   - `process_tree_policy`
   - `request_cancellation_mode`
   - 以及任何 route-aware command authoring 决策
5. 共享 runtime 不拥有 capability matrix、route policy、provider continuation、`selected_transport` 判定或 command resolution。

### 7.3 对现有 contract 的影响

1. `agent-onboarding-contract`
   - Phase A/B 无需增加新的 canonical transport 值；
   - 若 Phase C 引入 `acp_exec`，才需要 additive 扩展 `transport_kind` truth。
2. `agent-projection-contract`
   - `selected_transport=cli_exec` 的真值保持不变；
   - future `acp_exec` 只能作为 additive 扩展，不得与 `cli_exec` 共用 replay truth。
3. `adapter-health-and-route-probe-contract`
   - 推荐以 additive diagnostics 增补：
     - `entrypoint_resolution`
     - `process_tree_policy`
     - `spawn_error_code`
     - `shell_wrapped`
   - 不建议在 Phase A/B 就升级 minimum fields。
4. `agent-invoke-liveness-contract`
   - 不改写状态机语义；
   - 只把现有 Codex 已有的 process lifecycle 信号抽成 cross-adapter shared implementation；
   - shared runtime 必须能产出契约已存在的 `last_transport_activity_at`、`last_semantic_progress_at`、`terminate_phase`、`suspect_reason_codes[]` 与 partial snapshot 相关事实，而不是把这些责任继续散落在各 adapter 内。

### 7.4 ACP 扩展 seam 的边界

1. 未来若引 ACP，应像参考仓库一样把协议依赖隔离在单独层，避免 ACP SDK imports 渗入所有 adapter。
2. ACP 层可以借鉴以下模式：
   - 单一 session update/event bus
   - permission request queue
   - terminal manager
   - session list/load/resume/fork facade
3. 但 ACP 相关 session id、terminal id、permission request id 只能作为 ACP transport 内部 truth 或 presenter-safe companion state；不得取代 `runtime.orchestration` 的 shared-session truth，也不得被误当作 provider continuation handle。
4. ACP transport 一旦正式化，应单独经历：
   - transport contract formalization
   - adapter verification evidence
   - clean-room / packaged distribution smoke
   - support-matrix / playbook wording uplift

## 8. 风险与权衡

1. 共享 runtime 提取会触碰三条已有 adapter 热路径，若接口设计过大，容易把 adapter-specific 差异误收敛成脆弱抽象。
2. Windows/WSL/process-group 清理如果处理不完整，可能引入新的“子进程残留”或误杀问题。
3. 若团队把“借鉴 ACP 模式”误解为“当前直接上 ACP”，会与现有 `cli_exec` truth、support wording 与证据链发生冲突。
4. 未来同时维护 native `cli_exec` 与 `acp_exec` 会增加实现面，但这是为了保住 transport truthfulness 与 adoption risk 可控性。
5. 共享 runtime 一旦塞入 command resolution、shell authoring、probe interpretation、policy routing 等过多职责，会违反 `CS-027`，形成新的 cross-layer God object。
6. 若 `lifecycle observer` seam 只产出终态 result、不产出共享状态迁移与 snapshot，则各 adapter 仍会保留自己的 watchdog 和 liveness projection，shared runtime 会退化成“spawn helper”而不是真正的收敛 owner。
7. 缓解方式：
   - Phase A 先同时定稿 `resolved launch plan + lifecycle observer` 两条 seam，再做 process runtime 抽取；
   - parser / route policy / command resolution 继续留在 adapter；
   - 保持 additive refactor，沿用现有 smoke/integration coverage；
   - ACP 仅作为未来显式 Phase C，不提前承诺为当前主线。

## 9. 分阶段落地建议

1. Phase A：native `cli_exec` runtime 收敛
   - 新增共享 process runtime；
   - 定稿 adapter-authored `resolved launch plan` 与 shared `lifecycle observer` seam；
   - 先让 `Codex` 对接共享 lifecycle observer，证明 `graceful_interrupting / hard_terminating / partial snapshot` 不再是单 adapter 特例；
   - 再将 `Claude Code`、`GitHub Copilot` 切到统一 launch/timeout/partial-output/runtime diagnostics；
   - 保持现有 `cli_exec` canonical truth、capability matrix 与 adapter parser 不变。
2. Phase B：cross-platform hardening 与 evidence 收敛
   - 增补 Unix process-group / Windows taskkill / shell wrapping / stderr-tail diagnostics；
   - 让 `entrypoint_resolution / shell_wrapped / process_tree_policy / spawn_error_code` 成为可验证的 additive diagnostics；
   - 对三条 adapter 补齐一致的 targeted smoke 与 verify evidence；
   - 只要 transport truth 未变化，support wording 仍保持 `cli_exec` 正式路径。
3. Phase C：显式 ACP extension seam（experimental -> evidence-gated）
   - 隔离 ACP protocol layer；
   - 只通过新的显式 transport 或新 surface 接入；
   - 首批目标仅限 session history、permission、terminal、slash-command 等 host-facing richer capability；
   - 待 evidence 完整后，再决定是否进入 public support wording。

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.cli-exec-runtime-hardening-and-explicit-acp-extension-seam`
2. 建议 `target_module_ids`：`runtime.agent-projection`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - 是否严格保持 `cli_exec` canonical truth，不把 ACP 或其他 transport 偷渡进现有 truth slot
   - 共享 runtime 是否通过 `resolved launch plan + lifecycle observer` 收敛 process lifecycle，而没有吞掉 parser / routing / policy 责任
   - Windows/Unix process tree kill 与 partial-output preservation 是否可被统一证明
   - ACP future seam 是否与 provider continuation / shared session truth 明确解耦
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
   - 新 ADR（建议名）：`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
   - 若 Phase C 被采纳，再补 `agent-onboarding-contract.md` 与 `agent-projection-contract.md` 的 transport additive delta
