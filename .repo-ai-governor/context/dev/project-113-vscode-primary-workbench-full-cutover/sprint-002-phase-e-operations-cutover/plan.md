# sprint-002-phase-e-operations-cutover 计划

- Status: active
- Date: 2026-04-17
- Sprint Goal: 完成 operations cutover、service-native operations seam 与 bridge-exit governance 的标准执行骨架
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 冻结 operations cutover 与 typed-bridge exit criteria，补齐 service-native operations seam 和 workbench operations surface。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-946 | freeze phase-e operations cutover and bridge-exit criteria | prepare sprint-001 exit acceptance and phase-e handoff | in_progress |
| TK-947 | implement service-native operations seams and receipts | freeze phase-e operations cutover and bridge-exit criteria | planned |
| TK-948 | land operations workbench surfaces and bridge fallback governance | implement service-native operations seams and receipts | planned |
| TK-949 | prepare sprint-002 exit acceptance and phase-f handoff | land operations workbench surfaces and bridge fallback governance | planned |
| CR-001 | verify phase-e operations cutover | prepare sprint-002 exit acceptance and phase-f handoff | planned |

## 3. Exit Criteria

1. Phase E operations seam、workbench operations surface、bridge fallback governance 与 phase-f handoff 已全部具备 execution-ready 真值。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. `2026-04-17` sprint-001 clean closeout 已将当前 sprint 激活为新的 primary execution surface；`TK-946` 已切换为 `in_progress`，下一步从 `.tmp/project-113-boundary-parking/phase-e.patch` 重放 Phase E degraded fallback delta。
