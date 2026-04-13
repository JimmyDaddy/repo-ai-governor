# ACP Host-Facing Transport Formalization And Distribution Boundary ADR

- Status: active
- Date: 2026-04-13
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.acp-host-facing-transport-formalization-and-distribution-boundary.v1`

## 1. Context

`runtime.agent-projection` 已经 formalize 了 strict transport routing、shared native `cli_exec` runtime、provider continuation seam 与 onboarding/adoption readiness boundary。与此同时，仓库中也已经保留了 ACP internal seam，但现有 formal truth 同样明确了一条硬边界：

1. ACP 不能伪装成当前 `cli_exec` canonical truth。
2. ACP-local host protocol ids 不能回写到 shared session truth 或 provider continuation seam。
3. 若 ACP 要成为 host-facing ability，就必须以独立 technical solution 与独立 delivery handoff 推进。

因此，本轮 promotion 的关键问题不是“继续给 `cli_exec` 加一个隐式分支”，而是“如何把 ACP formalize 成诚实、显式、可后续 rollout 的独立 transport truth，同时不提前宣称 host distribution / support 已完成”。

## 2. Decision

1. `runtime.agent-projection` 正式接受 `acp_exec` 作为显式 host-facing transport truth；它与 `cli_exec` 并列存在，不是 alias，也不是 same-surface fallback 结果。
2. `connect / doctor / verify` 只能以 onboarding-owned composition 方式投影 `transport_kind=acp_exec` 的 readiness posture、diagnostic summary 与 `next_action(s)`；ACP row 不得回写成 `cli_exec` success，也不得把 packaged distribution / support uplift 写成本轮 promotion 已完成。
3. `AgentDescriptor` 可以 additive 方式携带 projection-owned、transport-scoped companion `acp_host_companion`，其 presenter-safe facts 包括：
   - `acp_session_id`
   - `permission_queue_id`
   - `terminal_channel_id`
   - optional `host_readiness_status`
   - optional `distribution_boundary`
   - optional `companion_state_summary`
4. `acp_host_companion` 只承载 ACP-local host protocol companion truth；这些 ids 不得覆盖 minimum `session_id`，不得进入 `AgentSessionRegistry` canonical truth，也不得编码到 `ProviderContinuationHandle`。
5. packaged distribution enablement、runtime-service enablement、clean-room verify execution 与 adopter-facing support wording uplift 全部后置到 `project-105-acp-host-facing-transport-rollout`；`project-101 / sprint-004` 只 formalize contract truth、delivery ownership 与 follow-up rollout skeleton。
6. `packages/adapter-sdk` 下现有 ACP seam 继续保持 implementation input 身份，不构成 host-facing contract proof，也不构成 rollout-ready evidence。

## 3. Consequences

1. ACP 若进入 host-facing direction，transport truthfulness 仍保持 fail-closed：同一 surface 内不会再把 ACP 与 `cli_exec` 混成一次成功结果。
2. ACP-local session / permission / terminal ids 有了稳定 carrier，不会再污染 shared session truth 或 provider continuation boundary。
3. `project-105` 获得了明确的 rollout 输入：真实 transport implementation、packaged distribution、runtime-service enablement、clean-room verify 与 support/docs uplift 都将在独立窗口收口。
4. 本轮 docs-only promotion 不会把 internal seam 的存在误写成 public support 或 runtime cutover 已完成。

## 4. Source Anchors

1. `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/review/solution_review_acp-host-facing-transport-formalization.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/provider-session-reuse-and-continuation-handle-seam.md`
