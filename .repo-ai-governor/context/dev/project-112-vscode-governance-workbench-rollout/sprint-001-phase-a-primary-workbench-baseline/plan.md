# sprint-001-phase-a-primary-workbench-baseline 计划

- Status: active
- Date: 2026-04-16
- Sprint Goal: 冻结 VS Code primary workbench baseline、task/review queue seam 与 service-owned projection contract
- Project: `project-112-vscode-governance-workbench-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 完成 Phase A 所需的 baseline service seam、VS Code workbench surface contract 与 promotion-safe evidence。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-936 | freeze vscode primary workbench baseline and service-owned task-review seams | DA-934 | in_progress |
| TK-937 | close sprint-001 and hand off phase-b outer-loop consolidation | freeze vscode primary workbench baseline and service-owned task-review seams | planned |

## 3. Exit Criteria

1. VS Code workbench baseline seam、task/review queue surface 与 initial promotion-safe evidence 已落地。

## 4. Sprint Notes

1. 优先冻结 service-owned truth，不让 VS Code 直接读取 canonical workspace files。
2. `2026-04-17` project-110 final closeout 已把当前 sprint 激活为新的 primary execution surface；`TK-936` 已切换为 `in_progress`。
