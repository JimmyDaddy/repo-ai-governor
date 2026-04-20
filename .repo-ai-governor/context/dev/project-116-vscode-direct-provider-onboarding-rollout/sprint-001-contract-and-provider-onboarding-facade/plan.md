# sprint-001-contract-and-provider-onboarding-facade 计划

- Status: planned
- Date: 2026-04-20
- Sprint Goal: Freeze the provider-onboarding contract, explicit mutation seam, and owner split baseline.
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Upstream:
  - `.repo-ai-governor/draft/approved_solution_review_vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/provider-onboarding-and-direct-api-key-entry-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`

## 1. Scope

1. Freeze the direct API key onboarding boundary without mutating connect/doctor/verify semantics.
2. Define the provider-onboarding snapshot/apply/receipt facade and selector defaults.
3. Prepare the first implementation handoff without activating the stream yet.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1004 | freeze direct-api-key onboarding contract and owner split | scaffold baseline | planned |
| TK-1005 | decompose service-native provider-onboarding snapshot apply and receipt facade | freeze direct-api-key onboarding contract and owner split | planned |
| TK-1006 | prepare sprint-001 handoff and activation recommendation | decompose service-native provider-onboarding snapshot apply and receipt facade | planned |

## 3. Exit Criteria

1. Provider-onboarding contract, owner split, and facade baseline are frozen in sprint artifacts.
2. Task cards, checklist, and tasks.csv are canonicalized and ready for later activation.

## 4. Sprint Notes

1. Do not activate this stream in current-context during promotion; keep it as a planned follow-up only.
