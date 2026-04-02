# checklist

- [ ] TK-488 align claude-code and github-copilot with shared invoke liveness contract
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 Claude Code / GitHub Copilot 对 shared invoke-liveness contract 的统一 rollout。

- [ ] TK-489 align ollama local-model and long-operation progress protections with invoke liveness governance
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 Ollama / local-model 的 invoke-liveness 对齐与长 thinking / tool-call 保护。

- [x] TK-501 roll out api-key remote adapter invocation runtime transport and delivery verification
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 `technical-solution.api-key-remote-adapter-invocation` 的 remote-api runtime baseline 落地。
  - 2026-04-02：完成第一段 runtime baseline：新增 remote-api config/schema、routing transport 选择、Codex/Claude remote probe+invoke baseline、transport-aware health truth 透传；剩余项拆分到 `TK-502`、`TK-503`、`TK-504`。
  - 2026-04-02：完成 working-tree CR 修复：remote-api retry 改为共享 timeout budget、`AbortError` 不重试、`credentialRef` 改为 schema/runtime 双 fail-closed；定向测试与整库 build 通过，CR 生命周期推进为 `resolved`。
  - 2026-04-02：台账纠偏完成；`TK-501` 明确收窄为 baseline task 并标记 `completed`，不再承担 `TK-502~504` 的后续收口责任。

- [ ] TK-502 integrate remote-api streaming liveness and execution diagnostics projection
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 remote-api stream 活动、request id、cancel semantics 到 shared invoke-liveness / execution diagnostics 的正式投影。

- [ ] TK-503 extend remote-api onboarding verification and credential-boundary surfaces
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 connect/doctor/verify 的 remote-api candidate truth、credentialRef/provider-local read-only discovery 与 next_action surface。

- [ ] TK-504 add remote-api delivery verification and clean-room smoke coverage
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 remote-api enabled distribution、clean-room smoke、release verification 与 rollout evidence。
