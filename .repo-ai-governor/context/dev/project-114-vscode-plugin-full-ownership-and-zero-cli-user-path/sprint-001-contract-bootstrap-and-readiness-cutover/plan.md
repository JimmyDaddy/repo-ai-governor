# sprint-001-contract-bootstrap-and-readiness-cutover 计划

- Status: completed
- Date: 2026-04-18
- Sprint Goal: Freeze the plugin full-ownership and zero-CLI bootstrap boundary, and establish the editor-native readiness cutover baseline.
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

1. Freeze the plugin full-ownership and zero-CLI bootstrap contract, remaining gap inventory, and exit criteria.
2. Define plugin-native bootstrap, readiness, and migration affordances without moving truth ownership into the extension host.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-963 | freeze plugin full-ownership and zero-cli bootstrap contract | DA-934;project-113 completion audit | completed |
| TK-964 | implement plugin-native bootstrap and readiness service seams | freeze plugin full-ownership and zero-cli bootstrap contract | completed |
| TK-965 | land editor-native bootstrap readiness and migration surfaces | implement plugin-native bootstrap and readiness service seams | completed |
| TK-966 | prepare sprint-001 exit acceptance and sprint-002 handoff | land editor-native bootstrap readiness and migration surfaces | completed |
| TK-983 | close sprint-001 boundary and activate sprint-002 execution surface | prepare sprint-001 exit acceptance and sprint-002 handoff | completed |

## 3. Exit Criteria

1. Plugin full-ownership and zero-CLI bootstrap exit criteria are frozen and traceable to follow-up implementation tasks.
2. Bootstrap/readiness cutover does not introduce extension-owned shadow state or premature support-truth uplift.

## 4. Sprint Notes

1. Do not claim support uplift or CLI deprecation in this sprint; it only freezes the boundary and migration path.
2. `2026-04-18`：sprint-001 已完成 closeout；`current-context.md` 已切换到 sprint-002 execution surface，后续 doctor/check/bootstrap cutover 在新的 active sprint 内推进。
