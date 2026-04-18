# sprint-005-support-truth-migration-and-cli-deprecation-closeout 计划

- Status: planned
- Date: 2026-04-18
- Sprint Goal: Use plugin-first evidence to close support truth, migration guidance, and CLI deprecation posture for the zero-CLI user path.
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

1. Refresh support truth, migration guidance, and validation evidence for the plugin-first zero-CLI path.
2. Define CLI deprecation posture so the CLI remains substrate/automation tooling rather than a required user bootstrap surface.

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-979 | freeze support-truth migration and cli deprecation contract | prepare sprint-004 exit acceptance and sprint-005 handoff | planned |
| TK-980 | execute plugin-first evidence and migration rehearsal bundle | freeze support-truth migration and cli deprecation contract | planned |
| TK-981 | refresh support docs deprecation posture and adoption guidance | execute plugin-first evidence and migration rehearsal bundle | planned |
| TK-982 | prepare project-final closeout and zero-cli delivery recommendation | refresh support docs deprecation posture and adoption guidance | planned |
| TK-987 | close sprint-005 boundary and activate project-final reviewer loop | prepare project-final closeout and zero-cli delivery recommendation | planned |
| TK-988 | finalize project-114 closeout and restore idle context | close sprint-005 boundary and activate project-final reviewer loop | planned |

## 3. Exit Criteria

1. Support docs and validation playbooks describe the plugin-first zero-CLI user path truthfully and with evidence-backed caveats.
2. CLI deprecation posture is explicit: substrate and automation remain available, but the plugin is the primary user-facing workbench.

## 4. Sprint Notes

1. Public claims may change only after plugin-first evidence, migration guidance, and validation playbooks close in the same window.
2. Keep this sprint `planned` until sprint-004 hands off; reserve local `CR-001` only after activation.
