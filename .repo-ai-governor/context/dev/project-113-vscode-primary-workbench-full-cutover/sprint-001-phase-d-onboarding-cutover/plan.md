# sprint-001-phase-d-onboarding-cutover 计划

- Status: completed
- Date: 2026-04-17
- Sprint Goal: 完成 onboarding cutover contract、service seam 与 VS Code readiness surface 的标准执行骨架
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 冻结 onboarding/readiness boundary，补齐 aggregation facade seam，并把 onboarding/readiness UX 正式收敛到 VS Code primary workbench。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-942 | freeze phase-d onboarding contract | DA-934 | completed |
| TK-943 | implement onboarding aggregation facade and diagnostics seams | freeze phase-d onboarding contract | completed |
| TK-944 | land onboarding wizard and readiness workbench surfaces | implement onboarding aggregation facade and diagnostics seams | completed |
| TK-945 | prepare sprint-001 exit acceptance and phase-e handoff | land onboarding wizard and readiness workbench surfaces | completed |
| CR-001 | verify phase-d onboarding cutover | prepare sprint-001 exit acceptance and phase-e handoff | resolved |
| CR-002 | sprint-001-phase-d-onboarding-cutover delegated recheck loop round 2 | verify phase-d onboarding cutover | resolved |
| CR-003 | sprint-001-phase-d-onboarding-cutover delegated recheck loop round 3 | sprint-001-phase-d-onboarding-cutover delegated recheck loop round 2 | resolved |

## 3. Exit Criteria

1. Phase D onboarding contract、service seam、readiness surface 与 phase-e handoff 已全部具备 execution-ready 真值。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 默认将该 sprint 作为首个 activation candidate，但只有在用户显式要求时才切为 active。
4. `2026-04-17` 已切换为 active primary stream；当前只保留 Phase D worktree delta，Phase E / H 与 out-of-scope governance patch 已从工作树隔离。
5. `2026-04-17` 已完成 optional chat participant activation fallback 与 host activation regression test，`TK-942 ~ TK-945` 当前全部进入 `completed`。
6. `2026-04-17` `CR-001` 已接受并修复 chat-capable activation path 的正向回归覆盖缺口，随后 `CR-002` 被激活为 fresh post-fix recheck round。
7. `2026-04-17` `CR-002` 已接受并修复 plan/task-package 对当前 blocking review round 的真值漂移，随后 `CR-003` 被激活为 fresh clean recheck round。
8. `2026-04-17` `CR-003` clean round 已返回无 actionable finding；当前 sprint 已完成 closeout，并将 primary execution surface 正式交接给 sprint-002-phase-e-operations-cutover。
