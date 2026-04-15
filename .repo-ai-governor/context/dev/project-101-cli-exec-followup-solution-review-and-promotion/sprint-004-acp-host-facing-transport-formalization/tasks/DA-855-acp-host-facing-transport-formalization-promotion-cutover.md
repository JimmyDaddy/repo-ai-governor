# DA-855 acp host-facing transport formalization promotion cutover

- Status: active
- Date: 2026-04-13
- Owner: AI-Agent
- Task: `TK-855`
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Sprint: `sprint-004-acp-host-facing-transport-formalization`

## 1. Summary

1. `technical-solution.acp-host-facing-transport-formalization` 已从 `approved` 推进为 `active` lifecycle-managed solution。
2. `runtime.agent-projection` 已 formalize `acp_exec` distinct transport truth、projection-owned `acp_host_companion` carrier，以及 ACP host-facing distribution/support 的 rollout-gated boundary。
3. lifecycle `final_paths` 固定为新的 ACP host-facing ADR；shared overview 与两份 contract 继续作为 shared formal docs 复用。
4. delivery ownership 已固定为 `followup_required + adopter_cli + packaged_distribution + runtime_service + planned rollout`，并指向新的 `project-105` planned rollout skeleton。

## 2. Immediate Operating Boundary

1. 本轮 formalize 的是 ACP host-facing transport truth、transport-scoped companion carrier 与 delivery boundary，不是 runtime cutover、packaged distribution 完成态或 public support wording uplift。
2. `acp_host_companion` 继续保持 projection-owned additive carrier；shared `session_id`、`AgentSessionRegistry` 与 `ProviderContinuationHandle` 不承接 ACP-local session / permission / terminal ids。
3. packaged distribution、runtime-service enablement、clean-room verify execution、`docs/support-matrix.md` 与其他 adopter-facing support wording uplift 均只作为 `project-105` rollout input，不进入本轮 `final_paths`。

## 3. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
6. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/plan.md`
