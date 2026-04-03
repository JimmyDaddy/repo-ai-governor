# Provider Session Reuse And Continuation Handle Seam ADR

- Status: active
- Date: 2026-04-04
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.provider-session-reuse-and-continuation-handle-seam.v1`

## 1. Context

当前 Governor 已经具备 shared session continuity、resume transcript 与 `session.main` turn metadata，但 provider-native backend conversation continuity 仍停留在半成品状态：

1. 部分 adapter 已能回收 `thread_id`、`message_id` 或等价 reference。
2. 这些 reference 尚未通过正式 adapter contract 回传给下一轮 invoke。
3. runtime 也没有稳定办法区分“provider 只是顺手返回了一个 id”与“本轮真的建立了可复用 continuation”。
4. 若 continuation handle 直接裸写到 shared session context，还会引入 secret leakage、lane overwrite 与 provider/private semantics 反向污染 runtime 的风险。

与此同时，`runtime.orchestration` 已正式接受 `session.main` 的多 turn continuity 与 shared-session truth 边界，因此 adapter-facing continuation seam 也必须被 formalize，而不能继续放在自由输出字段或 undocumented hack 上。

## 2. Decision

1. `runtime.agent-projection` 正式拥有 adapter-facing provider continuation request/result seam；实现落点可以在 `adapter-sdk`，但 owner 仍是 projection 模块。
2. continuation handle 必须是 adapter-owned opaque reference，但只允许保存 non-secret provider reference；bearer-like token、可重放凭据或 secret material 不得 inline 持久化。
3. reuse 是否成立只能由显式 `AgentStageContinuationResult.status` 判断；provider 顺手返回 `thread_id/message_id` 不再被视为系统级 reuse 承诺。
4. continuation seam 同时适用于 `cli_exec` 与 `remote_api`，但前提是 provider 或 surface 已有正式 continuation contract；unsupported surface 继续保持 stateless。
5. `mode/status/handle_kind` 等有限集合字段必须由集中 enum/constants 管理，不允许继续以漂移的 inline string literal 存在于 adapter 实现中。
6. `runtime.orchestration` 继续拥有 `lane_key`、session slot lifecycle、invalidation policy 与 turn-level continuation summary；`runtime.cli-interactive-shell` 只能消费 presenter-safe summary，不拥有 raw handle truth。

## 3. Consequences

1. Governor 可以正式承认“provider-native continuation 是一种 adapter-owned optimization seam”，而不是新的 canonical session source。
2. provider 返回 id 不再自动等价于“系统已支持下一轮复用”，adapter truthfulness 会更稳定。
3. provider 若只能返回敏感 continuation token，将在 secret-store reference seam formalized 之前继续保持 `unsupported`；这比把敏感 token 写进 shared session 更安全。
4. `Codex remote API` 成为最合理的 phase-A 接入对象；`Codex CLI`、`Claude remote API`、`Claude CLI` 与 `GitHub Copilot` 是否接入，取决于各自 transport contract 是否成熟。
5. adapter seam 与 session/orchestration seam 的 owner 将被明确拆开，后续正式化和实现 rollout 不再需要把 continuation 误塞进 `output` 自由字段或 CLI presenter 本地状态。

## 4. Source Anchors

1. `.repo-ai-governor/draft/provider-session-reuse-and-backend-conversation-continuity-technical-solution.md`
2. `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
