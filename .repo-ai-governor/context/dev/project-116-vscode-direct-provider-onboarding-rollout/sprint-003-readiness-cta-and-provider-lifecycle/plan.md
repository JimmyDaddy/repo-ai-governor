# sprint-003-readiness-cta-and-provider-lifecycle 计划

- Status: planned
- Date: 2026-04-20
- Sprint Goal: Converge readiness surfaces, CTA mapping, and provider lifecycle flows around the onboarding facade.
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Upstream:
  - `.repo-ai-governor/draft/approved_solution_review_vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/provider-onboarding-and-direct-api-key-entry-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`

## 1. Scope

1. Align overview, status, and doctor surfaces with provider-onboarding snapshot and canonical next actions.
2. Land Update API Key / Reconnect Provider flows and degraded-state guidance.
3. Prepare readiness parity evidence and sprint handoff.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1010 | converge overview status and doctor cta mapping with provider-onboarding snapshot | verify plugin human path exits env-var-first onboarding | planned |
| TK-1011 | land update-api-key reconnect-provider and degraded-state guidance | converge overview status and doctor cta mapping with provider-onboarding snapshot | planned |
| TK-1012 | verify provider lifecycle readiness parity and sprint handoff | land update-api-key reconnect-provider and degraded-state guidance | planned |

## 3. Exit Criteria

1. Readiness surfaces expose plugin-native onboarding/update CTAs without inventing a second runtime taxonomy.
2. Provider lifecycle and degraded-state guidance have targeted verification evidence.

## 4. Sprint Notes

1. CTA labels may be host-native, but runtime next_action ownership remains in runtime.agent-projection.
