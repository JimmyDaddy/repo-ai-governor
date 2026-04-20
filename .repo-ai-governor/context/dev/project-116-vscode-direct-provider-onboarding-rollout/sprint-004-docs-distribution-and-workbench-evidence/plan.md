# sprint-004-docs-distribution-and-workbench-evidence 计划

- Status: active
- Date: 2026-04-20
- Sprint Goal: Collect built-source and local-VSIX evidence and prepare docs/support truth refresh for direct onboarding.
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Upstream:
  - `.repo-ai-governor/draft/approved_solution_review_vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/provider-onboarding-and-direct-api-key-entry-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`

## 1. Scope

1. Refresh README/playbook/support wording only against real plugin evidence.
2. Capture built-source checkout and local-VSIX onboarding evidence, receipts, and backlinks.
3. Prepare support-truth boundary recommendation for final closeout.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1013 | refresh vscode direct-onboarding docs and copy against runtime evidence | verify provider lifecycle readiness parity and sprint handoff | in_progress |
| TK-1014 | capture built-source and local-vsix direct-onboarding evidence | refresh vscode direct-onboarding docs and copy against runtime evidence | planned |
| TK-1015 | prepare support-truth boundary recommendation and sprint handoff | capture built-source and local-vsix direct-onboarding evidence | planned |

## 3. Exit Criteria

1. Built-source and local-VSIX direct-onboarding evidence is captured and linked.
2. Docs/support truth draft refresh stays aligned with runtime evidence only.

## 4. Sprint Notes

1. README/support wording may only change together with the evidence window that proves plugin behavior.
2. `2026-04-21`：`sprint-003-readiness-cta-and-provider-lifecycle` 已在 `CR-001` resolved 与 `TK-1021` closeout write-back 后进入 completed history；当前 sprint 已切换为 active primary surface，`TK-1013` 成为新的 `in_progress` execution boundary。
