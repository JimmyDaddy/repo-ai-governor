# Agent Invoke Liveness Contract

- Status: active
- Date: 2026-04-13
- Contract ID: `contract.runtime.agent-invoke-liveness.v1`
- Producer Module: `runtime.agent-projection`

## 1. 目标

定义 agent invoke 生命周期中关于 liveness、stall 判断、graceful interrupt 与 hard-timeout fuse 的最小 machine contract，使 `session.main`、role runtime、interactive shell、diagnostics、orchestration service 以及后续 UI 可以共享同一套“为什么继续等待 / 为什么判定异常 / 为什么开始中断”的事实模型。

## 2. Minimum Fields

1. `adapter_id`
2. `surface_id`
3. `route_key`
4. `role_id`
5. `started_at`
6. `status`
7. `last_transport_activity_at`
8. `last_semantic_progress_at`
9. `last_terminal_signal_at`
10. `last_observed_event_type`
11. `last_observed_text_preview`
12. `active_operation_kind`
13. `active_operation_started_at`
14. `startup_timeout_ms`
15. `idle_timeout_ms`
16. `semantic_progress_timeout_ms`
17. `grace_timeout_ms`
18. `hard_timeout_ms`
19. `suspect_reason_codes[]`
20. `terminate_phase`
21. `partial_output_preserved`
22. `transport_kind`
23. `vendor_binding_kind`
24. `remote_request_id`
25. `cancel_mechanism`

## 3. Allowed Values

1. `status`
   - `starting`
   - `running`
   - `transport_idle_suspect`
   - `semantic_stall_suspect`
   - `graceful_interrupting`
   - `hard_terminating`
   - `completed`
   - `failed`
   - `cancelled`
2. `terminate_phase`
   - `none`
   - `soft`
   - `hard`
3. `cancel_mechanism`
   - `none`
   - `process_signal`
   - `abort_signal`
   - `http_stream_abort`
   - `provider_cancel_attempted`

## 4. Required Constraints

1. `hard_timeout_ms` 只能作为最后保险丝，不得成为唯一异常判定依据。
2. 真实续命信号必须显式区分：
   - process liveness
   - transport activity
   - semantic progress
3. Governor 自己生成的 system heartbeat 或 presenter-local “still running” 文案不得刷新 `last_transport_activity_at` 或 `last_semantic_progress_at`。
4. 当 invoke 进入 `transport_idle_suspect` 或 `semantic_stall_suspect` 后，必须先进入 grace window，再决定是否升级为 `hard_terminating`。
5. 在 `graceful_interrupting` 或 `hard_terminating` 之前，runtime 必须尽量保留 latest assistant draft、reasoning/tool/todo 快照与 execution details。
6. timeout budget 必须允许 role / route / surface 级覆盖；`reviewer/verifier/tester` 不得与普通 `direct-answer` 共用同一默认 hard timeout 心智。
7. `partial_output_preserved=true` 时，终态 diagnostics 与 execution details 必须能回看最后一段 AI 文本快照，而不只剩 command output。
8. adapter-local liveness snapshot 只能作为采集源；若 invoke 已经进入 orchestration service 生命周期，则最新 liveness 状态必须投影到 execution summary 与 execution event stream，不能只停留在 adapter 进程内存中。
9. `doctor/verify` 只负责 preflight readiness / auth / route abnormal；invoke 已开始后的 idle / semantic stall / graceful interrupt / hard timeout 必须通过 execution diagnostics、event replay 或同等级 runtime artifact 暴露。
10. 当 invoke 走 `remote_api` 时，liveness snapshot 必须 materialize `transport_kind` 与 `vendor_binding_kind`；若 provider 暴露稳定 request id，则应填充 `remote_request_id`。
11. `cancelled` 在 `remote_api` 场景默认只表示 Governor 已发出本地 abort 或 provider cancel attempt，不默认宣称 provider 端任务一定停止。
12. 当 invoke 走 native `cli_exec` 时，更新时间戳、`terminate_phase`、partial snapshot 与 suspect 状态迁移的 shared owner 应来自统一 process runtime 的 lifecycle observer seam；adapter parser 只负责 semantic-progress 回灌，不得在各 adapter 内复制第二套 liveness watchdog 真值。

## 5. Output Semantics

1. `last_transport_activity_at` 表示底层 child process / HTTP stream / structured event 通道最近一次有真实 I/O 活动。
2. `last_semantic_progress_at` 表示 assistant draft、thinking、tool/todo、command state 等语义事实最近一次真实推进。
3. `transport_idle_suspect` 表示进程可能仍存活，但在 `idle_timeout_ms` 内没有新的 transport activity。
4. `semantic_stall_suspect` 表示 transport 仍在继续，但在 `semantic_progress_timeout_ms` 内没有新的语义推进。
5. `graceful_interrupting` 表示已经开始尝试软中断，例如 `SIGTERM`、AbortSignal 或 stream abort。
6. `hard_terminating` 表示软中断未能得到终态，系统正在执行最终保险丝终止。
7. `last_transport_activity_at` 对 `remote_api` 必须覆盖 HTTP chunk、SSE event 与 structured stream event，而不只是本地 presenter heartbeat。
8. `cancel_mechanism=http_stream_abort` 或 `provider_cancel_attempted` 只描述 Governor 侧动作，不自动升级为“provider 端任务已强取消”的结论。

## 6. Execution Projection Requirements

当 invoke 结果通过 orchestration service 对外暴露时，至少必须满足：

1. `OrchestrationExecutionSummary` 可表达最新 liveness 压缩视图：
   - `liveness_status`
   - `liveness_suspect_reason_code`
   - `last_transport_activity_at`
   - `last_semantic_progress_at`
   - `latest_liveness_event_at`
   - `latest_liveness_event_type`
   - `latest_liveness_text_preview`
2. `OrchestrationServiceEvent` 必须能追加关键迁移事件，至少覆盖：
   - `execution_liveness_updated`
   - `execution_graceful_interrupt_started`
   - `execution_hard_termination_started`
   - `execution_partial_snapshot_persisted`
3. `subscribeExecution/getExecution/listExecutions` 必须能让 CLI embedded、sidecar 与 desktop 消费同一份 liveness 真值，而不是各自读取 adapter 私有状态。

## 7. Diagnostics Boundary

1. preflight diagnostics
   - command missing
   - credential missing / invalid
   - probe timeout / invalid response
   - route capability gap / degraded fallback
2. runtime invoke diagnostics
   - startup timeout
   - transport idle suspect
   - semantic stall suspect
   - graceful interrupt exceeded
   - hard timeout fallback
3. `doctor/verify` 不得为了生成 runtime liveness 结论而强制执行长时间 synthetic invoke。
4. 若 `doctor` 未来展示 invoke 类问题，也只能读取历史 execution 证据，并显式标明其不是即时 probe 结果。

## 8. Stable Reason Codes

1. `invoke_startup_timeout`
2. `invoke_transport_idle_timeout`
3. `invoke_semantic_stall_timeout`
4. `invoke_hard_timeout`
5. `invoke_process_exited_without_terminal_event`
6. `invoke_output_backpressure_suspected`
7. `invoke_graceful_interrupt_exceeded`
8. `invoke_partial_output_preserved`

## 9. Compatibility

1. `v1` 允许 `Codex`、`GitHub Copilot`、`Claude Code` 与 `Ollama` 保留不同的底层事件格式，只要最终能投影到同一 liveness contract。
2. `v1` 允许先以 telemetry-only 方式接入，再逐步 rollout 到 soft interrupt / hard terminate 策略。
3. `v1` 允许不同 surface 对 `active_operation_kind` 做差异化分类，但稳定顶层状态与 reason code 必须保持一致。
4. `v1` 要求 service-backed 与 embedded 路径最终消费同一 execution projection 语义，即使底层 adapter 事件 taxonomy 不同。
5. `v1` 允许通过 additive fields 扩展 `transport_kind`、`vendor_binding_kind`、`remote_request_id` 与 `cancel_mechanism`，使 child-process 与 remote-stream liveness 可以共用同一 contract。
6. `v1` 允许 native `cli_exec` shared runtime 作为 `Codex`、`Claude Code` 与 `GitHub Copilot` 的共用采集层，只要 adapter-specific parser 仍保有 semantic-progress owner，且 launch / diagnostics 相关字段继续保持 additive / optional truth。
