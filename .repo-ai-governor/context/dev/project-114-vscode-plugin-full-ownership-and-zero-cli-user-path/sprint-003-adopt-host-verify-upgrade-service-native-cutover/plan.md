# sprint-003-adopt-host-verify-upgrade-service-native-cutover 计划

- Status: planned
- Date: 2026-04-18
- Sprint Goal: Complete service-native adopt, host, verify, and upgrade flows in VS Code and exit the temporary CLI bridge for user-facing execution.
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md`
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md`
  - `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/project-113-vscode-primary-workbench-full-cutover-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `apps/vscode-extension/README.md`

## 1. Scope

1. Replace temporary CLI-bridge user journeys for adopt, host, verify, and upgrade with service-native VS Code workbench flows.
2. Preserve trust-sensitive approval, receipt, and rollback semantics while exiting bridge-only user paths.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-971 | freeze adopt-host-verify-upgrade bridge-exit contract | prepare sprint-002 exit acceptance and sprint-003 handoff | planned |
| TK-972 | implement service-native adopt-host-verify-upgrade orchestration seams | freeze adopt-host-verify-upgrade bridge-exit contract | planned |
| TK-973 | land workbench-native adopt-host-verify-upgrade trust-sensitive surfaces | implement service-native adopt-host-verify-upgrade orchestration seams | planned |
| TK-974 | prepare sprint-003 exit acceptance and sprint-004 handoff | land workbench-native adopt-host-verify-upgrade trust-sensitive surfaces | planned |
| TK-985 | close sprint-003 boundary and activate sprint-004 execution surface | prepare sprint-003 exit acceptance and sprint-004 handoff | planned |

## 3. Exit Criteria

1. User-facing adopt/host/verify/upgrade flows no longer require temporary CLI bridge ownership to complete successfully.
2. Trust-sensitive approvals, receipts, and rollback semantics remain service-owned and reviewable.

## 4. Sprint Notes

1. Temporary bridge semantics may remain only as non-user-facing substrate compatibility, with explicit exit evidence.
2. Keep this sprint `planned` until sprint-002 hands off; reserve local `CR-001` only after activation.
