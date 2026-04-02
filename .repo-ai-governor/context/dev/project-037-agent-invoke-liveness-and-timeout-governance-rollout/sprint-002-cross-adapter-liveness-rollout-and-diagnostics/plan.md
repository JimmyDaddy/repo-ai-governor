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
