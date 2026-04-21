# sprint-001-contract-and-provider-onboarding-facade 计划

- Status: completed
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
| TK-1004 | freeze direct-api-key onboarding contract and owner split | scaffold baseline | completed |
| TK-1005 | decompose service-native provider-onboarding snapshot apply and receipt facade | freeze direct-api-key onboarding contract and owner split | completed |
| TK-1006 | prepare sprint-001 handoff and activation recommendation | decompose service-native provider-onboarding snapshot apply and receipt facade | completed |
| TK-1019 | close sprint-001 boundary and activate sprint-002 execution surface | CR-001 reviewer-clean handoff | completed |

## 3. Exit Criteria

1. Provider-onboarding contract, owner split, and facade baseline are frozen in sprint artifacts.
2. Task cards, checklist, and tasks.csv are canonicalized and ready for later activation.

## 4. Sprint Notes

1. Do not activate this stream in current-context during promotion; keep it as a planned follow-up only.
2. `2026-04-20`：`project-115` final closeout 已完成，当前 sprint 已切换为 active primary surface；`TK-1004` 进入 `in_progress`，下一步先冻结 direct API key onboarding contract 与 owner split baseline。
3. `2026-04-20`：`TK-1004 ~ TK-1006` 已完成 implementation write-back；当前 sprint 进入 implementation complete / delegated CR pending 状态。service-owned provider-onboarding snapshot/apply/receipt facade 已落到 orchestration-service seam，`runConnect` 仍保持 analyze-first / env-var compatibility baseline，下一步在 fresh reviewer-clean 后创建 sprint closeout task 并激活 sprint-002。
4. `2026-04-20`：`CR-001` 已 resolved，accepted findings 已在同窗口完成修复与验证；provider-onboarding seam 现在对 selected backend 与 unsupported tool/provider pairing 都保持 fail-closed。
5. `2026-04-20`：`TK-1019` 已完成 sprint-001 closeout write-back；当前 sprint 正式收口为 `completed`，primary execution surface 已切换到 `sprint-002-plugin-native-direct-api-key-entry`。
