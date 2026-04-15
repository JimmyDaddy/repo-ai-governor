# DA-849 cli-exec additive diagnostics consumer promotion cutover

- Status: active
- Date: 2026-04-13
- Owner: AI-Agent
- Task: `TK-849`
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Sprint: `sprint-002-additive-diagnostics-consumer`

## 1. Summary

1. `technical-solution.cli-exec-additive-diagnostics-consumer-productization` 已从 `approved` 推进为 `active` lifecycle-managed solution。
2. `runtime.agent-projection` 已 formalize snake_case launch diagnostics consumer projection、camelCase implementation carrier 到 formal canonical naming 的单向映射，以及 onboarding/probe contract 的 additive clarification。
3. lifecycle `final_paths` 固定为新的 diagnostics-consumer ADR；共享 overview 与 contract 继续作为 shared formal docs 复用。
4. delivery ownership 已固定为 `followup_required + adopter_cli + planned rollout`，并指向新的 `project-103` planned rollout skeleton。

## 2. Immediate Operating Boundary

1. 本轮 formalize 的是 machine-readable diagnostics consumer projection 与 consumer guidance，不是新的 transport truth 或 public support wording。
2. `selected_entrypoint` 与 `request_cancellation_mode` 继续保持 probe-owned preserved facts；`shell_wrapped`、`process_tree_policy` 与 `spawn_error_code` 继续保持 additive-only evidence。
3. `agent-invoke-liveness-contract` 在本轮只作为边界参照，不被改写成新的 launch-diagnostics producer truth。

## 3. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
6. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`
