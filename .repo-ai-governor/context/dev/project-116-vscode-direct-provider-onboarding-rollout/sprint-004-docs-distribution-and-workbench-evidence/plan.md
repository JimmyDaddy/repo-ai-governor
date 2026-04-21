# sprint-004-docs-distribution-and-workbench-evidence 计划

- Status: completed
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
| TK-1013 | refresh vscode direct-onboarding docs and copy against runtime evidence | verify provider lifecycle readiness parity and sprint handoff | completed |
| TK-1014 | capture built-source and local-vsix direct-onboarding evidence | refresh vscode direct-onboarding docs and copy against runtime evidence | completed |
| TK-1015 | prepare support-truth boundary recommendation and sprint handoff | capture built-source and local-vsix direct-onboarding evidence | completed |
| TK-1022 | close sprint-004 boundary and activate sprint-005 execution surface | CR-001 reviewer-clean handoff | completed |

## 3. Exit Criteria

1. Built-source and local-VSIX direct-onboarding evidence is captured and linked.
2. Docs/support truth draft refresh stays aligned with runtime evidence only.

## 4. Sprint Notes

1. README/support wording may only change together with the evidence window that proves plugin behavior.
2. `2026-04-21`：`sprint-003-readiness-cta-and-provider-lifecycle` 已在 `CR-001` resolved 与 `TK-1021` closeout write-back 后进入 completed history；当前 sprint 已切换为 active primary surface，`TK-1013` 成为新的 `in_progress` execution boundary。
3. `2026-04-21`：`TK-1013 ~ TK-1015` 已完成同窗口 write-back：built-source / local-VSIX pack + distribution snapshot、direct-onboarding docs refresh、support-truth boundary handoff 全部落盘，下一步进入 fresh delegated CR loop，再创建 sprint closeout 任务并激活 `sprint-005-clean-room-validation-and-rollout-closeout`。
4. `2026-04-21`：`CR-001` 已 resolved，accepted ledger finding 已在同窗口修复；`TK-1022` 随后完成 sprint closeout write-back，当前 sprint 正式收口为 `completed`。
