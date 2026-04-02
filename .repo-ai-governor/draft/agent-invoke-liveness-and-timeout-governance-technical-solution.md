# Agent Invoke Liveness And Timeout Governance Technical Solution (Draft)

- Status: draft
- Date: 2026-04-02
- Owner: AI-Agent
- Scope: `agent invoke timeout / adapter liveness judgment / long-running review stability / partial output preservation / codex + github-copilot + claude-code + ollama`
- Target Modules:
  - `packages/adapters/codex`
  - `packages/adapters/github-copilot`
  - `packages/adapters/claude-code`
  - `packages/adapters/local-model`
  - `packages/adapter-sdk`
  - `packages/orchestration-service-client`
  - `packages/core-orchestration-service`
  - `apps/cli`
- Related:
  - `.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-004-migration-verification-and-cutover-governance/tasks/TK-479-deliver-migration-verification-rebuild-and-cutover-governance-for-durable-storage-surfaces.md`
  - `.repo-ai-governor/draft/layered-adapter-health-check-and-route-probe-technical-solution.md`
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
  - `packages/adapters/local-model/src/local-model-agent-adapter.ts`
  - `packages/adapter-sdk/src/layered-health-check-runtime.ts`
  - `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
  - `apps/cli/src/runtime/orchestration-service-runtime.ts`
  - `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-turn-progress-dock.ts`

## 1. 目的

本方案解决当前 agent invoke 生命周期中一个已经在真实使用里反复暴露的问题：

1. 角色执行，尤其是 `reviewer/verifier/tester`，天然可能运行很久。
2. 当前实现依然主要依赖固定 wall-clock timeout。
3. 一旦达到固定超时，即使子进程仍在产出有价值进展，也会被直接中断。
4. 用户最终看到的是：
   - `Codex invoke timed out after 600000ms.`
   - 或其他 surface 的固定超时失败。

这会把三种完全不同的状态混成一种失败：

1. 真的卡死了
2. 只是很慢，但仍在推进
3. 只是在某个长命令、长 tool call、长推理阶段里暂时没有新文本

本方案的目标不是“完全移除 timeout”，而是把 timeout 从主判定手段降级为最后保险丝，并建立一套统一的 liveness / progress / stall 判断模型。

## 2. 问题定义

### 2.1 当前行为的问题

当前各 adapter 的 invoke 大体都采用：

1. 启动 CLI / 本地服务调用
2. 开始流式读取 stdout/stderr 或 structured events
3. 同时挂一个固定 timeout
4. 到点后直接终止子进程

这种模型的问题是：

1. “是否异常”几乎完全由时间长度决定。
2. 内部的 `still running` 文案只是 Governor 自己生成的状态提示，不等于来自 agent 的真实存活信号。
3. 不同 stage 的时长特征完全不同，但预算经常被写成同一类常量。
4. 超时后虽然部分输出可能已经出现，但没有统一的 graceful-interrupt / partial-preserve / failure-classification 机制。

### 2.2 真实失败模式

从当前仓库已出现的问题看，至少有以下模式：

1. `reviewer` 在 10 分钟内持续执行命令、持续产生命令状态，但到点仍被 kill。
2. 用户看到大量 “Codex repository review is still running ...” 的系统消息，但这些消息并不能延长实际 timeout。
3. 普通对话、工具可用性检查、review 这些完全不同的工作负载，会共用过于接近的超时判断心智。
4. 当 stdout/stderr 或 event stream 沉默时，系统无法区分：
   - 子进程真的挂了
   - 子进程在等待远端模型
   - 子进程正在跑一个长工具调用
   - 输出管道被阻塞

### 2.3 核心矛盾

核心矛盾不是“要不要超时”，而是：

`我们需要判断 agent 是否仍在真实推进，而不是仅仅判断它已经运行了多久。`

## 3. 目标

### 3.1 必须达成

1. 固定 timeout 不再作为主要异常判定依据。
2. adapter runtime 必须显式区分：
   - process liveness
   - transport activity
   - semantic progress
   - terminal completion
3. `Codex`、`GitHub Copilot`、`Claude Code`、`Ollama` 必须共享统一的 liveness contract。
4. 用户在前台必须能看到：
   - 正在运行
   - 暂时空闲
   - 疑似卡住
   - 正在尝试优雅中断
   - 被最终保险丝终止
5. 在 graceful kill 之前，系统必须尽量保留 partial output、latest assistant draft、tool/todo/reasoning 快照。
6. `doctor` / `verify` 必须能解释 preflight readiness / auth / route abnormal；runtime diagnostics artifact / execution replay 必须能解释 invoke 期异常。
7. liveness 状态不能只停留在 adapter 进程内存中，必须可通过 orchestration service 的 summary / event stream 传播到 CLI、sidecar 与 desktop surface。

### 3.2 非目标

1. 不要求第一阶段就彻底移除所有 timeout。
2. 不要求每个外部 CLI 都原生支持 watchdog / heartbeat 协议。
3. 不在本方案中引入远端 central supervisor service。
4. 不要求把所有 role 的预算都做成动态机器学习模型。

## 4. 外部资料启发

本方案在 `2026-04-02` 额外参考了以下官方资料：

1. Node.js `child_process` 文档明确说明：
   - `timeout` 到期后会发送 `killSignal`，默认是 `SIGTERM`
   - 若子进程拦截信号但不退出，父进程仍需等待
   - 若 stdout/stderr 未被及时消费，子进程可能因 pipe buffer 阻塞
   - 来源：
     - [Node.js child_process](https://nodejs.org/api/child_process.html)
2. OpenAI Responses streaming 文档明确提供 typed semantic events，如：
   - `response.created`
   - `response.output_text.delta`
   - `response.completed`
   - 这说明“真实流式语义事件”比固定时间长度更适合作为 liveness 依据
   - 来源：
     - [OpenAI streaming responses](https://platform.openai.com/docs/guides/streaming-responses)
3. Claude Code 官方 CLI 文档明确支持：
   - `--output-format stream-json`
   - `--include-partial-messages`
   - `--include-hook-events`
   - `--verbose`
   - 这意味着 Claude Code 具备比单纯 wall-clock 更细粒度的进度信号面
   - 来源：
     - [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
4. Claude Code 官方 setup / troubleshooting 文档明确提到：
   - `claude doctor`
   - `/doctor`
   - 这支持“环境健康”和“运行期 liveness”应分层建模，而不是混在 timeout 里
   - 来源：
     - [Set up Claude Code](https://docs.anthropic.com/en/docs/claude-code/getting-started)
     - [Claude Code troubleshooting](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/troubleshooting)
5. Ollama 官方 streaming / tool-calling 文档明确要求在 streaming 时累计：
   - `thinking`
   - `content`
   - `tool_calls`
   - chat API 还会返回 `done` 与 `done_reason`
   - 这说明 local-model surface 本身就天然适合用“真实事件推进”来判定 liveness
   - 来源：
     - [Ollama streaming](https://docs.ollama.com/capabilities/streaming)
     - [Ollama tool calling](https://docs.ollama.com/capabilities/tool-calling)
     - [Ollama chat API](https://docs.ollama.com/api/chat)
6. GitHub Copilot CLI 官方文档明确将认证检查拆成：
   - 环境变量 token
   - keychain
   - `gh auth status`
   - 这再次说明 readiness / auth 不应被 timeout 或 no-op invoke 替代
   - 来源：
     - [Authenticating GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli)
     - [Troubleshooting GitHub Copilot CLI authentication](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/troubleshoot-copilot-cli-auth)
7. systemd 的 watchdog / timeout 设计提供了很好的类比：
   - `WatchdogSec` 依赖服务主动发送 keepalive
   - `EXTEND_TIMEOUT_USEC` 允许在满足条件时延长超时，而不是静态到点就 kill
   - 这说明“最后保险丝 + 真实 keepalive/extend”是一种成熟的通用模式
   - 来源：
     - [systemd.service](https://www.freedesktop.org/software/systemd/man/247/systemd.service.html)
     - [sd_notify](https://www.freedesktop.org/software/systemd/man/sd_notify.html)
     - [Red Hat: changing the timeout limit](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_systemd_unit_files_to_customize_and_optimize_your_system/proc_changing-the-timeout-limit_assembly_working-with-systemd-unit-files)

这些资料共同支持一个结论：

`更合理的做法不是“取消超时”，而是把 timeout、watchdog、stream events、semantic progress、graceful termination 组合成分层状态机。`

## 5. 方案比较

### 5.1 方案 A：继续固定超时，到点直接 kill

优点：

1. 实现最简单
2. 行为确定

问题：

1. 高误伤长任务
2. 解释力弱
3. 无法区分“慢”与“挂”

结论：

不推荐继续作为主线。

### 5.2 方案 B：仅把超时时间调大

优点：

1. 能缓解最明显的误杀
2. 改动成本低

问题：

1. 只是延后问题
2. 仍然没有 stall / liveness 判断
3. 异常 CLI 可能会挂更久

结论：

可作为临时止血，但不是终局。

### 5.3 方案 C：超时作为保险丝 + 多信号 liveness 判定

优点：

1. 能区分 transport / progress / terminal
2. 更适合 long-running reviewer/tester
3. 能保留 partial output 并给出更清晰失败原因

问题：

1. 需要改 adapter contract 与 runtime telemetry
2. 需要按 surface 做信号映射

结论：

推荐作为长期主线。

## 6. 最终推荐

本方案推荐：

1. 保留 hard timeout，但把它降级为最后保险丝。
2. 在 adapter runtime 中引入统一的 liveness state machine。
3. 主判定改为：
   - process liveness
   - transport activity
   - semantic progress
   - terminal completion
4. 在 suspected stall 后先进入 grace period，再做软中断与硬中断。
5. 所有中断前必须先尽量保存 partial output / latest assistant draft / activity history。
6. adapter-local liveness snapshot 必须进一步投影到 orchestration service execution summary / event stream，成为 sidecar / desktop / replay 可消费的共享真值。
7. `doctor/verify` 继续只负责 preflight readiness / probe / routing；invoke idle / semantic stall / hard timeout 归 execution diagnostics 与 event replay。

一句话总结：

`不再用“运行多久”直接判断 agent 是否异常，而是用“是否还活着、是否还有真实事件、是否还有语义推进”来决定何时中断。`

## 7. 信号模型

## 7.1 Signal A：Process Liveness

表示子进程 / HTTP stream / adapter execution substrate 是否仍然存活。

典型来源：

1. `spawn` 成功
2. `pid` 仍存在
3. HTTP stream 连接仍未关闭
4. terminal event：
   - exit code
   - signal
   - `done`
   - `response.completed`

用途：

1. 判断“进程还在不在”
2. 不能单独判断“有没有推进”

## 7.2 Signal B：Transport Activity

表示底层 transport 仍有真实输入输出事件。

典型来源：

1. stdout line
2. stderr line
3. parsed JSON event
4. SSE chunk
5. streamed `thinking/content/tool_calls/token delta`

用途：

1. 判断“底层链路是否还在动”
2. 用于 idle watchdog

注意：

1. Governor 自己生成的 “still running ...” 系统文案不计入 transport activity。
2. 只要 signal 来源不是 adapter/child 本身，就不能续命。

## 7.3 Signal C：Semantic Progress

表示 agent 的工作语义发生了真实推进。

典型来源：

1. assistant draft 长度增长
2. `thinking` 增长
3. `command_execution` 从 `running -> completed/failed`
4. `todo_list` 状态变化
5. 新增 tool call
6. tool call 结果返回
7. `response.output_text.delta`
8. `done_reason` / terminal structured event

用途：

1. 判断“虽然可能很慢，但它确实在推进”
2. 用于 semantic stall watchdog

注意：

1. 重复的 heartbeat 文本不算 semantic progress。
2. 完全相同的重复 detail line 不算 semantic progress。

## 7.4 Signal D：System Heartbeat

表示 Governor 为了 UX 生成的状态提示。

例如：

1. `Codex repository review is still running (345s elapsed)`
2. `supervisor 正在检查可用的 direct-answer surface`

用途：

1. 仅用于前台可见性
2. 不用于续命

这是强约束：

`System heartbeat 不得重置 liveness timer。`

## 8. 状态机

推荐引入以下统一状态：

1. `starting`
2. `running`
3. `transport_idle_suspect`
4. `semantic_stall_suspect`
5. `graceful_interrupting`
6. `hard_terminating`
7. `completed`
8. `failed`
9. `cancelled`

状态推进建议：

1. `starting -> running`
   - 观测到 spawn success 或首个 transport event
2. `running -> transport_idle_suspect`
   - 在 `idleTimeoutMs` 内没有任何真实 transport activity
3. `running -> semantic_stall_suspect`
   - transport 还在，但在 `semanticProgressTimeoutMs` 内没有任何 semantic progress
4. `*_suspect -> graceful_interrupting`
   - suspect 持续超过 grace window
5. `graceful_interrupting -> hard_terminating`
   - 软中断后仍无 terminal event
6. 任意状态 -> `completed/failed/cancelled`
   - 收到 terminal event

## 9. 时间预算模型

推荐把预算拆成 5 类：

1. `startupTimeoutMs`
2. `idleTimeoutMs`
3. `semanticProgressTimeoutMs`
4. `graceTimeoutMs`
5. `hardTimeoutMs`

建议默认基线（Draft）：

| workload | startup | idle | semantic | grace | hard |
| --- | --- | --- | --- | --- | --- |
| `direct-answer` | 15s | 45s | 120s | 15s | 15m |
| `planner/architect/coder` | 20s | 60s | 300s | 20s | 45m |
| `reviewer/verifier/tester` | 30s | 90s | 600s | 30s | 90m |
| `local-model/ollama` | 20s | 60s | 180s | 20s | 30m |

说明：

1. `hardTimeoutMs` 仍然存在，但已明显晚于 stall 检测。
2. `reviewer` 的 hard timeout 不应继续只有 `600000ms` 级别。
3. 这些默认值必须可按 role / route / surface override。

## 10. 判断规则

## 10.1 续命规则

1. 任一真实 transport signal 到来，刷新 `lastTransportActivityAtMs`。
2. 任一 semantic progress signal 到来，刷新 `lastSemanticProgressAtMs`。
3. terminal event 直接结束 invoke，不再等待 timeout。

## 10.2 疑似空转

如果：

1. process 还活着
2. 但 `now - lastTransportActivityAtMs > idleTimeoutMs`

则进入：

1. `transport_idle_suspect`

这通常意味着：

1. 子进程卡住
2. 远端没有回任何 chunk
3. 读取链路异常
4. 输出管道被阻塞

## 10.3 疑似语义停滞

如果：

1. transport 仍在继续
2. 但 `now - lastSemanticProgressAtMs > semanticProgressTimeoutMs`

则进入：

1. `semantic_stall_suspect`

这通常意味着：

1. 一直只有重复 heartbeat
2. 一直只有噪音 stderr
3. 工具链在异常重试但没有任何新结果

## 10.4 长命令 / 长工具调用保护

需要额外引入：

1. `activeOperationKind`
2. `activeOperationStartedAtMs`

当存在已知长操作时：

1. 可以临时延长 `semanticProgressTimeoutMs`
2. 但不得绕过 `hardTimeoutMs`

典型场景：

1. `git diff` / `rg` 不需要特殊放宽
2. `pnpm run build` / integration test / repository review 级批量搜索，可以得到更长 operation allowance

## 11. Graceful Interrupt 策略

在 suspect 状态下，不应立刻 kill。

推荐顺序：

1. 发出前台状态：
   - `reviewer 疑似停滞；正在等待最后的真实输出。`
2. 尝试抓取最新 partial snapshot：
   - latest assistant draft
   - latest reasoning text
   - open tool call state
   - latest command status
3. 如 adapter 支持，尝试发送软中断：
   - `SIGTERM`
   - AbortSignal
   - HTTP abort
4. 等待 `terminateGraceMs`
5. 若仍无 terminal event，再升级为硬终止

关键原则：

`在 hard kill 之前，先保存状态；在判定 stalled 之前，先给 grace。`

## 12. Adapter 映射建议

## 12.1 Codex

可作为 liveness 信号的事件：

1. `thread.started`
2. `turn.started`
3. `item.updated`
4. `item.completed`
5. `turn.completed`
6. raw stdout/stderr line

语义推进事件建议包括：

1. `agent_message`
2. `reasoning`
3. `command_execution`
4. `todo_list`
5. tool-like structured item

不计入续命：

1. Governor 生成的 `Codex repository review is still running ...`

## 12.2 GitHub Copilot

可作为 liveness 信号的事件：

1. CLI JSON events
2. assistant partial/final text
3. tool/task style updates
4. raw stderr

补充要求：

1. readiness/auth 应先用分层 health check 判定
2. invoke liveness 只处理“已经开始执行后是否推进”

## 12.3 Claude Code

推荐：

1. 默认 probe/automation 路径优先使用 `--output-format stream-json`
2. 在需要更丰富 liveness 信号时打开：
   - `--include-partial-messages`
   - `--include-hook-events`
3. `--verbose` 可作为诊断和回放增强，而不是主协议依赖

语义推进来源：

1. partial messages
2. hook events
3. tool / bash execution state

## 12.4 Ollama

Ollama 的 liveness 逻辑应最直接：

1. HTTP 连接存活 = process/transport 基线
2. `thinking/content/tool_calls` chunk = semantic progress
3. `done=true` / `done_reason` = terminal

因此：

1. 不应继续用固定 wall-clock 作为主判断
2. 应优先按 chunk 事件来续命

## 13. 统一诊断与传播契约

建议新增统一结构：

```ts
interface AgentInvokeLivenessSnapshot {
  status:
    | 'starting'
    | 'running'
    | 'transport_idle_suspect'
    | 'semantic_stall_suspect'
    | 'graceful_interrupting'
    | 'hard_terminating'
    | 'completed'
    | 'failed'
    | 'cancelled';
  startedAt: string;
  lastTransportActivityAt?: string;
  lastSemanticProgressAt?: string;
  lastTerminalSignalAt?: string;
  lastObservedEventType?: string;
  lastObservedTextPreview?: string;
  activeOperationKind?: string;
  activeOperationStartedAt?: string;
  startupTimeoutMs: number;
  idleTimeoutMs: number;
  semanticProgressTimeoutMs: number;
  graceTimeoutMs: number;
  hardTimeoutMs: number;
  suspectReasonCode?: string;
  terminatePhase?: 'soft' | 'hard';
}
```

建议 reason code：

1. `invoke_startup_timeout`
2. `invoke_transport_idle_timeout`
3. `invoke_semantic_stall_timeout`
4. `invoke_hard_timeout`
5. `invoke_process_exited_without_terminal_event`
6. `invoke_output_backpressure_suspected`
7. `invoke_graceful_interrupt_exceeded`

## 13.2 Orchestration Service 投影契约

仅在 adapter runtime 内维护 `AgentInvokeLivenessSnapshot` 还不够。

当前仓库的共享执行面已经是：

1. `OrchestrationExecutionSummary`
2. `OrchestrationServiceEvent`
3. `getExecution/listExecutions/subscribeExecution`
4. sidecar / desktop / service-backed runtime 复用的 execution replay seam

因此本方案要求：

1. adapter-local liveness 只能作为采集源，不能作为最终唯一事实来源。
2. 一旦 execution 进入 orchestration service，最新 liveness 结果必须被投影到 execution summary。
3. 每次关键状态迁移必须写入 execution event stream，保证断线重连与事后回放能看到同一条诊断链路。

建议最小投影字段：

```ts
interface OrchestrationExecutionSummary {
  // existing fields...
  livenessStatus?:
    | 'starting'
    | 'running'
    | 'transport_idle_suspect'
    | 'semantic_stall_suspect'
    | 'graceful_interrupting'
    | 'hard_terminating'
    | 'completed'
    | 'failed'
    | 'cancelled';
  livenessSuspectReasonCode?: string;
  lastTransportActivityAt?: string;
  lastSemanticProgressAt?: string;
  latestLivenessEventAt?: string;
  latestLivenessEventType?: string;
  latestLivenessTextPreview?: string;
}
```

建议 event stream 增加：

1. `execution_liveness_updated`
2. `execution_graceful_interrupt_started`
3. `execution_hard_termination_started`
4. `execution_partial_snapshot_persisted`

其中：

1. `summary` 负责给列表页、execution details 顶部状态条、desktop badge 提供最新压缩视图。
2. `event stream` 负责保留完整状态迁移链、reason code、partial snapshot 持久化时点。
3. `subscribeExecution` 必须能增量读取上述事件，不能要求前台自己访问 adapter 进程内存。

强约束：

1. 若 execution 是 service-backed，则前台显示应优先读取 orchestration service summary / event stream。
2. CLI embedded path 也必须经由同一 execution summary / event stream 输出，避免 CLI 与 desktop 呈现不同的 liveness 真值。

## 13.3 `doctor/verify` 与 Runtime Diagnostics 分层

本方案必须显式区分：

1. preflight readiness / auth / protocol / route capability
2. invoke 已开始后的 runtime liveness / stall / interrupt / hard-timeout

边界如下：

1. `doctor/verify`
   - 继续基于 layered health check、probe、route selection 结果
   - 负责解释：
     - command missing
     - credential missing / invalid
     - probe timeout / invalid response
     - route capability gap / degraded fallback
2. execution diagnostics / replay artifact / execution event stream
   - 负责解释：
     - invoke startup timeout
     - transport idle suspect
     - semantic stall suspect
     - graceful interrupt exceeded
     - hard timeout fallback

这意味着：

1. `doctor/verify` 不应为了生成 liveness 结论而强制执行长时间 synthetic invoke。
2. 若 `doctor` 未来要展示 invoke 类问题，也只能读取“历史 execution 证据”，而不是把它伪装成即时 probe 健康状态。
3. route diagnostics 文案与 execution diagnostics 文案必须分开，避免用户把“环境不可用”和“这次 invoke 运行中停滞”混成同一类故障。

## 14. 前台 UX 建议

前台应明确把以下状态区分展示：

1. `正在运行`
2. `最近仍有真实输出`
3. `最近没有 transport activity`
4. `最近没有 semantic progress`
5. `正在尝试优雅中断`
6. `已保存最新 AI 输出快照`
7. `因长时间无真实推进而终止`

不建议再只显示：

1. `still running`
2. `timed out after X ms`

## 15. 实施阶段建议

### Phase A：Shared Contract + Telemetry

1. 新增 shared liveness snapshot / reason code contract
2. adapter runtime 统一记录：
   - `lastTransportActivityAtMs`
   - `lastSemanticProgressAtMs`
   - `lastObservedEventType`
3. orchestration service 增加 execution summary / event stream 的 liveness 投影字段与事件类型
4. 先不改变 kill 策略，只补 telemetry 与 service propagation

### Phase B：Codex First

1. 在 Codex adapter 上先实现：
   - idle watchdog
   - semantic watchdog
   - grace interrupt
   - hard timeout fallback
2. `reviewer` 先吃新逻辑

原因：

1. 当前真实误伤主要在 Codex reviewer 上暴露
2. Codex 的 structured item taxonomy 也最适合先做

### Phase C：Claude Code / GitHub Copilot

1. 对齐 shared contract
2. 按各自 CLI 输出事件做 signal mapping
3. 收口 `doctor/verify` 预检文案与 execution diagnostics 文案边界

### Phase D：Ollama / Local Model

1. 把 HTTP chunk 事件纳入同一 contract
2. 对 `thinking/content/tool_calls/done` 建立统一 signal mapping

## 16. 验收标准

本方案落地后，至少应满足：

1. `reviewer` 在超过旧固定 timeout 后，只要仍有真实 semantic progress，就不会被直接 kill。
2. Governor 自己生成的系统 heartbeat 不再续命。
3. `doctor/verify` 能区分：
   - auth/unavailable
   - probe / protocol abnormal
   - route capability gap / degraded fallback
4. execution diagnostics / orchestration event replay 能区分：
   - invoke idle
   - invoke semantic stall
   - invoke hard timeout
   - graceful interrupt exceeded
5. graceful terminate 前，latest assistant draft / reasoning / tool/todo 快照可回看。
6. failed turn 的 execution details 中，能看见最后一段 AI 文本快照，而不只剩 command output。
7. CLI embedded、sidecar、desktop 看到的是同一份 execution liveness summary / event stream 真值。
8. Codex / GitHub Copilot / Claude Code / Ollama 都能落到统一 liveness contract 上。

## 17. 风险与注意事项

1. 若把 semantic progress 判定写得太严格，仍会误杀“长工具调用但暂时无输出”的任务。
2. 若把 semantic progress 判定写得太宽松，又会让噪音 stderr 无限续命。
3. 若不持续消费 stdout/stderr，Node pipe buffer 可能导致子进程阻塞，这会制造伪 stall。
4. 某些第三方 CLI 不保证稳定输出事件 taxonomy，因此 Phase A 必须先有 telemetry 观测窗口。
5. 若 liveness 只保存在 adapter-local 内存而不写入 orchestration service，CLI、sidecar、desktop 之间会出现状态漂移，execution replay 也无法解释终止原因。

## 18. 最终结论

当前“固定超时 -> 到点直接打断”的模型已经不适合多 agent、长 review、长 tool call 的真实工作负载。

推荐直接转向：

1. `hard timeout` 保底
2. `idle watchdog` 看 transport
3. `semantic watchdog` 看真实推进
4. `graceful interrupt` 优先
5. `partial output preservation` 必选

一句话总结：

`长期主线不再是“超时就杀”，而是“先判断 agent 是否还在真实推进；只有在长期无真实活动或超过最终保险丝时才终止”。`
