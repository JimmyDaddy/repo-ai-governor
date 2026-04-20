# sprint-005-clean-room-validation-and-rollout-closeout 计划

- Status: completed
- Date: 2026-04-21
- Sprint Goal: Complete zero-env-var clean-room validation, claim-parity review, and rollout closeout.
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Upstream:
  - `.repo-ai-governor/draft/approved_solution_review_vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/provider-onboarding-and-direct-api-key-entry-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding.md`

## 1. Scope

1. Run zero-env-var clean-room rehearsal and failure-path validation.
2. Review rollout claim parity and remaining CLI compatibility wording.
3. Publish completion audit and rollout closeout recommendation.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1016 | run zero-env-var clean-room rehearsal and failure-path validation | prepare support-truth boundary recommendation and sprint handoff | completed |
| TK-1017 | review rollout claim parity and remaining cli compatibility wording | run zero-env-var clean-room rehearsal and failure-path validation | completed |
| TK-1018 | close rollout project and publish completion audit | review rollout claim parity and remaining cli compatibility wording | completed |

## 3. Exit Criteria

1. Zero-env-var clean-room rehearsal and failure-path validation are complete.
2. Project completion audit and rollout closeout recommendation are ready.

## 4. Sprint Notes

1. Closeout must leave current-context idle unless the user explicitly activates project-116 afterward.
2. `2026-04-21`：`sprint-004-docs-distribution-and-workbench-evidence` 已在 `CR-001` resolved 与 `TK-1022` closeout write-back 后进入 completed history；当前 sprint 已切换为 active primary surface，`TK-1016` 成为新的 `in_progress` execution boundary。
3. `2026-04-21`：`TK-1016` 已完成 zero-env-var clean-room evidence window：direct-onboarding + CLI selector-first targeted tests、fresh build/test:packages、以及 sprint-005 packaged-root / extracted-VSIX scratch verification全部通过；下一步进入 rollout claim parity 与 final support wording review。
4. `2026-04-21`：`TK-1017` 已完成最终 claim-parity 文案收口与 doc-facing verification，新增 `project-116-sprint-005-rollout-claim-parity-summary.md`；当前 primary boundary 已切换到 `TK-1018`，用于 project-final delegated CR、completion audit 与 idle-context restoration。
5. `2026-04-21`：`CR-002` 在 completion-audit blocker-state drift 修复后 clean 收口，`TK-1018` 随后完成 completion audit、idle-context restoration 与 completed-history 回写；当前 sprint 正式恢复到 `completed` 真值。
