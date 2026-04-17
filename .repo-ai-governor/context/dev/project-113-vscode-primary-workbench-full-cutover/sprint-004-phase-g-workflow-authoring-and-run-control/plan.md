# sprint-004-phase-g-workflow-authoring-and-run-control 计划

- Status: active
- Date: 2026-04-17
- Sprint Goal: 完成 workflow authoring、governed run-control 与 workflow studio continuity 的标准执行骨架
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 冻结 workflow authoring/run-control contract，补齐 governed command seam，并把 workflow studio continuity UX 收口到 VS Code primary workbench。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-954 | freeze phase-g workflow authoring and run-control contract | prepare sprint-003 exit acceptance and phase-g handoff | in_progress |
| TK-955 | implement workflow authoring and governed run-control seams | freeze phase-g workflow authoring and run-control contract | planned |
| TK-956 | land workflow studio control surfaces and continuity ux | implement workflow authoring and governed run-control seams | planned |
| TK-957 | prepare sprint-004 exit acceptance and phase-h handoff | land workflow studio control surfaces and continuity ux | planned |
| CR-001 | verify phase-g workflow authoring and run control | prepare sprint-004 exit acceptance and phase-h handoff | planned |

## 3. Exit Criteria

1. Phase G workflow authoring/run-control seam、studio continuity UX 与 phase-h handoff 已全部具备 execution-ready 真值。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 该 sprint 默认保持 planned，等待 sprint-003-phase-f-secure-authoring-and-user-settings handoff 或用户显式激活。
4. `2026-04-17` sprint-003 已在 `CR-002` resolved round 后完成 closeout；当前 sprint 已激活为新的 primary execution surface，`TK-954` 切换为 `in_progress`，下一步从 clean baseline 冻结 workflow authoring、governed run-control 与 workflow studio continuity 边界，同时保持 Phase E degraded fallback 与 Phase F secure-authoring contract 不回退。
