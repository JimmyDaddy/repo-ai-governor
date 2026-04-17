# sprint-005-phase-h-support-promotion-and-distribution-readiness 计划

- Status: active
- Date: 2026-04-17
- Sprint Goal: 完成 support-truth promotion、distribution readiness evidence 与 public-claim gate package 的标准执行骨架
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 冻结 support-promotion/distribution-readiness 边界，完成 evidence bundle、docs refresh、claim gate 与 project-final closeout 准备。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-958 | freeze phase-h promotion and distribution-readiness boundary | prepare sprint-004 exit acceptance and phase-h handoff | in_progress |
| TK-959 | execute gui and distribution readiness evidence bundle | freeze phase-h promotion and distribution-readiness boundary | planned |
| TK-960 | refresh support-truth docs and claim-promotion package | execute gui and distribution readiness evidence bundle | planned |
| TK-961 | prepare project-final closeout and next-stream recommendation | refresh support-truth docs and claim-promotion package | planned |
| CR-001 | verify phase-h promotion evidence and readiness deltas | prepare project-final closeout and next-stream recommendation | planned |

## 3. Exit Criteria

1. Phase H support-truth refresh、distribution readiness evidence、claim-promotion package 与 project-final recommendation 已全部具备 execution-ready 真值。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 该 sprint 默认保持 planned，等待 sprint-004-phase-g-workflow-authoring-and-run-control handoff 或用户显式激活。
4. `2026-04-17` sprint-004 已在 `CR-002` resolved round 后完成 closeout；当前 sprint 已激活为新的 primary execution surface，`TK-958` 切换为 `in_progress`，下一步从 `.tmp/project-113-boundary-parking/phase-h.patch` 重放 distribution-readiness 代码边界，并同步冻结 docs truth-sync 与 support-claim gate 输入。
