# checklist

- [x] TK-488 align claude-code and github-copilot with shared invoke liveness contract
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 Claude Code / GitHub Copilot 对 shared invoke-liveness contract 的统一 rollout。
  - 2026-04-03：任务激活，开始为 Claude Code CLI / GitHub Copilot CLI 补齐 shared `invokeLiveness` snapshot、timeout/partial-output diagnostics 与终态 reason code 对齐。
  - 2026-04-03：完成第一段 CLI invoke-liveness 对齐：两条 adapter stream 现已 materialize shared `invokeLiveness` snapshot、`transportKind=cli_exec`、transport/semantic activity timestamps、latest text preview、partial-output preservation 与 timeout suspect reason codes；定向 smoke、`pnpm run build`、ledger sync gates 通过，任务继续保持 `active`。
  - 2026-04-03：补齐 CLI graceful-interrupt 迁移：timeout / abort 开始时两条 adapter 会先发出 `graceful_interrupting` status，再进入终态 failed/cancelled path；定向 smoke、`pnpm run build`、ledger sync gates 通过，任务继续保持 `active`。
  - 2026-04-03：完成 orchestration consumer 收口：linked `session.main -> execution` 现已通过 graceful-interrupt regression 覆盖 `EXECUTION_GRACEFUL_INTERRUPT_STARTED`、partial snapshot persisted 与 execution summary liveness truth；core-orchestration-service 定向 vitest、adapter smoke、`pnpm run build` 与 ledger sync gates 通过，任务标记 `completed`。

- [ ] TK-489 align ollama local-model and long-operation progress protections with invoke liveness governance
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 Ollama / local-model 的 invoke-liveness 对齐与长 thinking / tool-call 保护。

- [x] TK-501 roll out api-key remote adapter invocation runtime transport and delivery verification
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 `technical-solution.api-key-remote-adapter-invocation` 的 remote-api runtime baseline 落地。
  - 2026-04-02：完成第一段 runtime baseline：新增 remote-api config/schema、routing transport 选择、Codex/Claude remote probe+invoke baseline、transport-aware health truth 透传；剩余项拆分到 `TK-502`、`TK-503`、`TK-504`。
  - 2026-04-02：完成 working-tree CR 修复：remote-api retry 改为共享 timeout budget、`AbortError` 不重试、`credentialRef` 改为 schema/runtime 双 fail-closed；定向测试与整库 build 通过，CR 生命周期推进为 `resolved`。
  - 2026-04-02：台账纠偏完成；`TK-501` 明确收窄为 baseline task 并标记 `completed`，不再承担 `TK-502~504` 的后续收口责任。

- [x] TK-502 integrate remote-api streaming liveness and execution diagnostics projection
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 remote-api stream 活动、request id、cancel semantics 到 shared invoke-liveness / execution diagnostics 的正式投影。
  - 2026-04-02：任务激活，开始实现 Codex / Claude remote_api stream 的 liveness metadata、abort semantics 与 execution diagnostics projection。
  - 2026-04-03：完成第一段 event-stream / diagnostics 投影：Codex/Claude remote_api stream 现已产出 `invokeLiveness` snapshot，并透传到 `session.main` 与 orchestration session stream；remote stream timeout 覆盖到 body consumption，partial-output preservation / timeout diagnostics 回归通过。execution-summary 级 liveness 字段尚未单独引入，因此任务保持 `active`。
  - 2026-04-03：完成 execution-summary / execution event stream 收口：新增 orchestration liveness snapshot contract、linked `session.main -> execution` relay、execution liveness event types 与 linked execution 回归测试；定向 vitest、`pnpm run build`、`check-task-ledger-sync`、`check-sprint-plan-status-sync` 通过，任务标记 `completed`。

- [x] TK-503 extend remote-api onboarding verification and credential-boundary surfaces
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 connect/doctor/verify 的 remote-api candidate truth、credentialRef/provider-local read-only discovery 与 next_action surface。
  - 2026-04-03：任务激活并完成第一段 safe-local onboarding/verification 收口：新增 `tool_transport_matrix` payload、remote-api candidate/probe truth 投影，以及更具体的 remote-api credential next actions；定向 vitest 与 `pnpm run build` 通过，任务保持 `active` 继续承接 schema/runtime discovery 后续项。
  - 2026-04-03：完成 schema/runtime discovery 收口：config schema 现已接受 `credentialRef` 与 `allowProviderLocalConfig`，Codex/Claude remote_api probe 会稳定投影 `credential_source` / `endpoint_source` 的 manual-only/provider-local 真值；定向 vitest、`pnpm run build`、ledger sync gates 通过，任务标记 `completed`。

- [x] TK-504 add remote-api delivery verification and clean-room smoke coverage
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 remote-api enabled distribution、clean-room smoke、release verification 与 rollout evidence。
  - 2026-04-03：完成 release verification / clean-room smoke 收口：新增 dist-binary remote-api rehearsal、`path/link/tgz` clean-room remote-api smoke、playbook 对齐与 `DA-504` delivery artifact；`pnpm run build`、`release:verify-local`、`release:verify-cleanroom-local-install` 与 ledger/delivery registry sync gates 通过，任务标记 `completed`。
