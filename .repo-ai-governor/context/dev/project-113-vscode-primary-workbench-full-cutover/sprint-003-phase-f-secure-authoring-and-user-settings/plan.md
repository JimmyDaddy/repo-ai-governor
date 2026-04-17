# sprint-003-phase-f-secure-authoring-and-user-settings 计划

- Status: active
- Date: 2026-04-17
- Sprint Goal: 完成 secure authoring、user settings 与 secret readiness UX 的标准执行骨架
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 冻结 secure authoring boundary，补齐 redaction/user-settings/secret readiness seam，并把 trust-sensitive UX 收敛到 editor-native surface。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-950 | freeze phase-f secure authoring boundary | prepare sprint-002 exit acceptance and phase-f handoff | in_progress |
| TK-951 | implement secure authoring seams and redaction baseline | freeze phase-f secure authoring boundary | planned |
| TK-952 | land user settings and secret readiness ux | implement secure authoring seams and redaction baseline | planned |
| TK-953 | prepare sprint-003 exit acceptance and phase-g handoff | land user settings and secret readiness ux | planned |
| CR-001 | verify phase-f secure authoring baseline | prepare sprint-003 exit acceptance and phase-g handoff | planned |

## 3. Exit Criteria

1. Phase F secure authoring boundary、redaction baseline、user settings/secret readiness UX 与 phase-g handoff 已全部具备 execution-ready 真值。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 该 sprint 默认保持 planned，等待 sprint-002-phase-e-operations-cutover handoff 或用户显式激活。
4. `2026-04-17` sprint-002 clean closeout 已将当前 sprint 激活为新的 primary execution surface；`TK-950` 当前进入 `in_progress`，下一步从 clean baseline 开始推进 secure authoring、user settings 与 secret readiness UX，不复用 Phase E degraded fallback 的实现边界。
