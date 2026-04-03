# sprint-002-cross-adapter-liveness-rollout-and-diagnostics 计划

- Status: active
- Date: 2026-04-02
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint Goal: 将 shared invoke-liveness contract 扩展到 `GitHub Copilot`、`Claude Code` 与 `Ollama / local-model`，并承接 `api-key remote adapter invocation` formal solution 的 transport-aware rollout / delivery verification follow-through。

## 1. Task Package

1. `TK-488` align claude-code and github-copilot with shared invoke liveness contract
2. `TK-489` align ollama local-model and long-operation progress protections with invoke liveness governance
3. `TK-501` roll out api-key remote adapter invocation runtime transport and delivery verification
4. `TK-502` integrate remote-api streaming liveness and execution diagnostics projection
5. `TK-503` extend remote-api onboarding verification and credential-boundary surfaces
6. `TK-504` add remote-api delivery verification and clean-room smoke coverage

## 2. Exit Criteria

1. `GitHub Copilot` 与 `Claude Code` 已映射到 shared invoke-liveness contract。
2. `Ollama / local-model` 已接入统一状态机，并为长 thinking / tool call / stream idle 场景补齐保护。
3. 各 adapter 在 reason code、status projection 与 partial-output 语义上不再漂移。
4. 主要 adapter 路径已具备结构化 diagnostics 快照。
5. `api-key remote adapter invocation` 的 transport-aware routing、binding truthfulness、credential boundary 与 delivery verification follow-through 已有明确实现承接面。

## 3. Milestones

1. 2026-04-02：创建 planned `sprint-002`，冻结 `TK-488`、`TK-489`、`TK-501` 作为 cross-adapter rollout 与 remote-api follow-through package。
2. 2026-04-02：激活 `sprint-002`，执行 `TK-501` runtime baseline：落地 remote-api config/routing、Codex/Claude probe+invoke baseline、transport-aware health truth，并拆分 `TK-502`、`TK-503`、`TK-504` 承接剩余 rollout。
3. 2026-04-02：纠偏 task decomposition：`TK-501` 明确收窄为已完成的 remote-api runtime baseline task；`TK-502`、`TK-503`、`TK-504` 分别独立承接 streaming liveness、onboarding/credential boundary、delivery verification。
4. 2026-04-03：推进 `TK-502` 第一段实现：Codex/Claude remote_api stream 已产出 `invokeLiveness` snapshot、`remoteRequestId`、transport/semantic activity timestamps、partial-output preservation 与 timeout-budget diagnostics，并透传至 `session.main` 与 orchestration session stream。
5. 2026-04-03：完成 `TK-502` 收口：新增 orchestration execution liveness snapshot contract、linked `session.main -> execution` relay、execution liveness event types 与 linked execution 回归测试；execution summary 与 execution subscription event stream 现已保留 remote-api liveness truth，任务标记 `completed`。
6. 2026-04-03：启动 `TK-503` 并完成第一段 safe-local onboarding/verification 收口：`connect / doctor / verify` 现已输出 remote-api `tool_transport_matrix`、candidate/probe truth 与更具体的 credential next actions；schema/runtime 级 credentialRef/provider-local read-only discovery 继续留在 `TK-503` 后续切片。
7. 2026-04-03：完成 `TK-503` 收口：config schema 现已正式接受 `credentialRef` 与 `allowProviderLocalConfig`，Codex/Claude remote_api probe 稳定投影 `credential_source` / `endpoint_source`，其中 Claude Code 在显式开启时只读解析官方 settings scope 中的 provider-local `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL`；定向 vitest、`pnpm run build` 与 ledger sync gates 通过。
8. 2026-04-03：完成 `TK-504` 收口：`verify-local-distribution.js` 新增 dist-binary remote-api rehearsal，`verify-cleanroom-local-install.js` 新增 `path/link/tgz` remote-api smoke，playbook 文档与 `DA-504` artifact 已同步；`release:verify-local`、`release:verify-cleanroom-local-install`、ledger sync 与 delivery registry gate 通过。
9. 2026-04-03：启动 `TK-488`，对齐 `Claude Code CLI` / `GitHub Copilot CLI` 与 shared invoke-liveness contract，当前焦点为 stream event `invokeLiveness` snapshot、timeout/partial-output reason code 与终态 diagnostics 统一化。
10. 2026-04-03：完成 `TK-488` 第一段实现：`Claude Code CLI` / `GitHub Copilot CLI` stream event 已对齐 shared `invokeLiveness` snapshot 与 timeout/partial-output reason code，adapter smoke、`pnpm run build` 与 ledger sync gates 通过；任务继续保持 `active`，后续收口 graceful interrupt / broader diagnostics consistency。
11. 2026-04-03：推进 `TK-488` 第二段实现：`Claude Code CLI` / `GitHub Copilot CLI` 在 timeout / abort 开始时会先 materialize `graceful_interrupting`，并在 shared `invokeLiveness` snapshot 中保留 `cancelMechanism` 与 suspect reason code；adapter smoke、`pnpm run build` 与 ledger sync gates 通过。
12. 2026-04-03：完成 `TK-488` 收口：新增 orchestration consumer regression，linked `session.main -> execution` 现已验证 `EXECUTION_GRACEFUL_INTERRUPT_STARTED`、partial snapshot persisted 与 execution summary liveness truth 对 shared CLI invoke-liveness snapshot 的承接闭环；core-orchestration-service 定向 vitest、adapter smoke、`pnpm run build` 与 ledger sync gates 通过，任务标记 `completed`。
