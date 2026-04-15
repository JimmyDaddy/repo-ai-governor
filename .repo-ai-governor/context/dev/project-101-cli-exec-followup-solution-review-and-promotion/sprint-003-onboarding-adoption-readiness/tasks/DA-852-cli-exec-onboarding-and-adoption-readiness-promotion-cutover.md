# DA-852 cli-exec onboarding and adoption readiness promotion cutover

- Status: active
- Date: 2026-04-13
- Owner: AI-Agent
- Task: `TK-852`
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Sprint: `sprint-003-onboarding-adoption-readiness`

## 1. Summary

1. `technical-solution.cli-exec-onboarding-and-adoption-readiness-productization` 已从 `approved` 推进为 `active` lifecycle-managed solution。
2. `runtime.agent-projection` 已 formalize native `cli_exec` readiness evidence chain、onboarding-owned `verification_status / diagnostic_summary / next_action(s)` composition，以及 local adoption / support wording 的后置边界。
3. lifecycle `final_paths` 固定为新的 onboarding/adoption ADR；共享 overview 与两份 contract 继续作为 shared formal docs 复用。
4. delivery ownership 已固定为 `followup_required + adopter_cli + docs_playbook + planned rollout`，并指向新的 `project-104` planned rollout skeleton。

## 2. Immediate Operating Boundary

1. 本轮 formalize 的是 runtime-side readiness evidence chain 与 consumer ownership boundary，不是新的 minimum contract 或 public support truth。
2. `adapter-health-and-route-probe-contract` 继续拥有 layered probe truth 与 probe-visible preserved facts；`agent-onboarding-contract` 继续拥有 `verification_status / diagnostic_summary / next_action(s)` 的 composition responsibility。
3. `docs/local-adoption-playbook.md` 与 `docs/support-matrix.md` 只作为 rollout / evidence follow-up input，不进入本轮 `final_paths`，也不在本 sprint 直接 uplift。

## 3. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
6. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`
