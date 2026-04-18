# sprint-002-doctor-check-and-workspace-bootstrap-cutover 计划

- Status: active
- Date: 2026-04-18
- Sprint Goal: Complete plugin-primary doctor, check, and workspace bootstrap flows so users no longer need a visible CLI bootstrap path.
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

1. Move doctor, check, and workspace bootstrap into plugin-visible workbench flows backed by service-owned receipts and diagnostics.
2. Keep fail-closed setup behavior, diagnostics truth, and docs/help parity while removing user-visible CLI dependence.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-967 | freeze doctor-check and workspace bootstrap cutover contract | prepare sprint-001 exit acceptance and sprint-002 handoff | planned |
| TK-968 | implement service-native doctor-check and workspace bootstrap seams | freeze doctor-check and workspace bootstrap cutover contract | planned |
| TK-969 | land workbench-native doctor-check and workspace bootstrap surfaces | implement service-native doctor-check and workspace bootstrap seams | planned |
| TK-970 | prepare sprint-002 exit acceptance and sprint-003 handoff | land workbench-native doctor-check and workspace bootstrap surfaces | planned |
| TK-984 | close sprint-002 boundary and activate sprint-003 execution surface | prepare sprint-002 exit acceptance and sprint-003 handoff | planned |

## 3. Exit Criteria

1. Doctor, check, and workspace bootstrap have a plugin-primary execution contract with explicit fallback and verification expectations.
2. Later service-native adopt/host work can reuse the same bootstrap and diagnostics truth without reopening CLI-first assumptions.

## 4. Sprint Notes

1. Bootstrap and diagnostics should stay fail-closed; hidden shell fallbacks must not silently preserve the old user path.
2. `2026-04-18`：sprint-001 已完成 handoff，本 sprint 已激活为当前 execution surface；下一步从 `TK-967` 开始推进 doctor/check/workspace-bootstrap 的 plugin-primary cutover。
