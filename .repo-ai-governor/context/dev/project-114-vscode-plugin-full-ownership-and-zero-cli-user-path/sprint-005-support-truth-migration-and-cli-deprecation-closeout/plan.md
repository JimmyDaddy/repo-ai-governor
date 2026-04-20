# sprint-005-support-truth-migration-and-cli-deprecation-closeout 计划

- Status: completed
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
| TK-979 | freeze support-truth migration and cli deprecation contract | prepare sprint-004 exit acceptance and sprint-005 handoff | completed |
| TK-980 | execute plugin-first evidence and migration rehearsal bundle | freeze support-truth migration and cli deprecation contract | completed |
| TK-981 | refresh support docs deprecation posture and adoption guidance | execute plugin-first evidence and migration rehearsal bundle | completed |
| TK-982 | prepare project-final closeout and zero-cli delivery recommendation | refresh support docs deprecation posture and adoption guidance | completed |
| TK-987 | close sprint-005 boundary and activate project-final reviewer loop | prepare project-final closeout and zero-cli delivery recommendation | completed |
| TK-988 | finalize project-114 closeout and restore idle context | close sprint-005 boundary and activate project-final reviewer loop | completed |

## 3. Exit Criteria

1. Support docs and validation playbooks describe the plugin-first zero-CLI user path truthfully and with evidence-backed caveats.
2. CLI deprecation posture is explicit: substrate and automation remain available, but the plugin is the primary user-facing workbench.

## 4. Sprint Notes

1. Public claims may change only after plugin-first evidence, migration guidance, and validation playbooks close in the same window.
2. Keep this sprint `planned` until sprint-004 hands off; reserve local `CR-001` only after activation.
3. `2026-04-18`：sprint-004 已完成 closeout，本 sprint 已切换为当前 active execution surface；本地 `CR-001` 已在 activation 时预留，后续 fresh reviewer round 继续复用该编号。
4. `2026-04-18`：`TK-979` 已切换为当前首个 implementation lane，用于冻结 support truth / migration / CLI optional posture 的 evidence-gated contract。
5. `2026-04-18`：`TK-979 ~ TK-982` 已在同一窗口完成 contract freeze、zero-cli rehearsal evidence、public support docs refresh 与 project-final handoff 准备；当前 sprint-005 进入 implementation complete / CR pending 状态，下一步固定执行 fresh reviewer round。
6. `2026-04-18`：sprint-005 的 `CR-001` 已 resolved，installed-VSIX public wording 与 activation-coverage runbook drift 已修复并验证；当前 sprint 保持 `active`，仅作为 project-final closeout surface 继续复用其 `tasks/` 与 `review/` 路径。
7. `2026-04-18`：project-final delegated reviewer loop 在 `CR-009` clean 收口，`TK-988` 随后完成 completion audit、idle context restoration 与 completed history 回写；当前 sprint 的 project-final closeout 面已恢复到 `completed` 真值。
