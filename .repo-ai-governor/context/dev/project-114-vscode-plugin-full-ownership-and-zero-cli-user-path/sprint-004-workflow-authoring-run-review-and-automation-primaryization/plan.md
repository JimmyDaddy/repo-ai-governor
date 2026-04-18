# sprint-004-workflow-authoring-run-review-and-automation-primaryization 计划

- Status: active
- Date: 2026-04-18
- Sprint Goal: Make workflow authoring, run-control, review, and automation a plugin-primary user path with continuity-safe UX.
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

1. Make workflow authoring, run-control, review, and automation queue surfaces plugin-primary instead of CLI-first handoff paths.
2. Preserve continuity, degraded fallback, and service-owned truth across authoring and execution surfaces.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-975 | freeze plugin-primary workflow and automation contract | prepare sprint-003 exit acceptance and sprint-004 handoff | active |
| TK-976 | implement workflow authoring run-control review and automation seams | freeze plugin-primary workflow and automation contract | planned |
| TK-977 | land workflow studio review and automation primary surfaces | implement workflow authoring run-control review and automation seams | planned |
| TK-978 | prepare sprint-004 exit acceptance and sprint-005 handoff | land workflow studio review and automation primary surfaces | planned |
| TK-986 | close sprint-004 boundary and activate sprint-005 execution surface | prepare sprint-004 exit acceptance and sprint-005 handoff | planned |

## 3. Exit Criteria

1. Workflow authoring, run-control, review, and automation surfaces are planned as plugin-primary user journeys with continuity-safe fallbacks.
2. The zero-CLI user path covers daily repo development and management flows before public support-truth uplift.

## 4. Sprint Notes

1. This sprint must preserve project-113 degraded fallback behavior while changing the primary user journey ownership.
2. Keep this sprint `planned` until sprint-003 hands off; reserve local `CR-001` only after activation.
3. `2026-04-18`：sprint-003 已完成 handoff，本 sprint 已激活为当前 execution surface；本地 `CR-001` 已在 activation 时预留，后续 fresh reviewer round 继续复用该编号。
4. `2026-04-18`：`TK-975` 已切换为当前首个 implementation lane，用于冻结 workflow authoring / run-control / review / automation 的 plugin-primary contract。
