# Transport Selection Authority And Strict Transport Routing ADR

- Status: active
- Date: 2026-04-09
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.transport-selection-authority-and-strict-transport-routing.v1`

## 1. Context

`runtime.agent-projection` 已经拥有 `baseline / cli_exec / remote_api` 三类 transport truth，也已经能在 runtime 中根据 config 与 `remoteApi` 信息解析出具体 transport。真正剩下的问题不是“是否支持更多 transport”，而是“当用户已经显式选择 transport 时，谁有权改写这次执行的 truth”。

当前风险主要来自三个方向：

1. onboarding truth 仍可能被 consumer 误读为“surface 主、transport 次”的松散提示，而不是可回放的执行约束。
2. presenter / diagnostics 若把失败的 `remote_api` 静默改写为同 surface 的 `cli_exec` 成功，会破坏本次执行的 canonical truth。
3. runtime / contract 层对 `remote_api` 的 formalization，容易被 adopter-facing docs 误提升为“已经公开正式支持”的 wording。

因此，本 follow-up ADR 需要把 transport selection authority、strict transport routing 与 evidence-gated public wording 边界正式写进 module truth。

## 2. Decision

1. `transport` 是 authoritative user input，而不是 runtime optimization hint。
2. 当 tool row 已显式声明 `transport` 时，本次执行必须保留该 `transport_kind` 作为 canonical truth；同一 surface 内禁止静默 `remote_api <-> cli_exec` 自动切换。
3. 如果显式选择的 transport 不可用，runtime 必须 fail-closed，并输出结构化 diagnostics 与显式 `next_action`；`switch_to_cli_exec` 只能是人工 follow-up 建议，不是隐式重试。
4. onboarding canonical machine surface 固定为 `enabled_tools[]`；`transport_selection_source`、`transport_selection_locked` 与 `configured_remote_api` 是正式 truth 字段。
5. 若兼容期仍保留 `tool_transport_matrix`，它只能机械派生自 `enabled_tools[]`；`remote_api_candidate` 只允许作为 `configured_remote_api` 的 compatibility alias。
6. `selected_surface` 与 `selected_transport` 必须同时保留在 replay / diagnostics truth 中；cross-surface fallback 仍可存在，但必须与 same-surface transport failover 明确区分。
7. `codex` / `claude-code` 的 `remote_api` 可以先在 runtime / contract 层 formalize 为用户可选 transport；`github-copilot` 继续诚实保持 `cli_exec` 正式路径。
8. `docs/support-matrix*` 与 `docs/local-adoption-playbook*` 的 adopter-facing public wording 只有在 clean-room / verify evidence gate 通过后才能 uplift。

## 3. Consequences

1. transport truthfulness 成为正式 runtime boundary，避免 future implementation 以“更智能的 fallback”为名再次腐蚀 execution truth。
2. consumer 只需要消费一条 canonical onboarding machine surface，不再依赖并行 truth slot 来拼接 transport state。
3. diagnostics / review / replay 可以稳定解释“这次为什么失败”，而不是只看到一个被改写过的 surface-level success。
4. cross-surface fallback policy 仍能继续演化，但不会再与 same-surface transport switching 混写。
5. public support wording 与 runtime / contract support 被显式拆层治理，避免在 evidence 未就绪时提前承诺 adopter-facing support。
