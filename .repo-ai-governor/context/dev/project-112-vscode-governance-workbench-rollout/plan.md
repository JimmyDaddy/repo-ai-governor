# project-112-vscode-governance-workbench-rollout 计划

- Status: completed
- Date: 2026-04-16
- Stage Mapping: technical solution rollout
- Phase Mapping: primary workbench baseline / outer-loop consolidation / workflow studio and full workbench cutover
- Upstream:
  - `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. 目标

1. 将 technical-solution.vscode-full-governance-workbench-and-task-driven-orchestration 的 formal direction 拆成真实 rollout project。
2. 按 Phase A-C 依次交付 VS Code primary workbench baseline、outer-loop consolidation 与 workflow studio/full-workbench cutover。
3. 为 delivery registry 提供真实 planned follow-up stream、task ledger 与后续 closeout 路径。

## 2. Sprint 细化

## 2.1 sprint-001-phase-a-primary-workbench-baseline

- Status: completed
- Sprint Goal: 冻结 VS Code primary workbench baseline、task/review queue seam 与 service-owned projection contract
- Task Package: `TK-936、TK-937`

## 2.2 sprint-002-phase-b-outer-loop-consolidation-and-operations

- Status: completed
- Sprint Goal: 收口 automation queue、artifact workbench、multi-workspace overview 与 typed CLI bridge governance
- Task Package: `TK-938、TK-939`

## 2.3 sprint-003-phase-c-workflow-studio-and-full-workbench-cutover

- Status: completed
- Sprint Goal: 规划 workflow studio、support-truth evidence 与 full workbench cutover
- Task Package: `TK-940、TK-941`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-936 | sprint-001-phase-a-primary-workbench-baseline | freeze vscode primary workbench baseline and service-owned task-review seams | runtime contract baseline | DA-934 | completed |
| TK-937 | sprint-001-phase-a-primary-workbench-baseline | close sprint-001 and hand off phase-b outer-loop consolidation | governance handoff | freeze vscode primary workbench baseline and service-owned task-review seams | completed |
| TK-938 | sprint-002-phase-b-outer-loop-consolidation-and-operations | land outer-loop consolidation and typed cli bridge governance baseline | workbench operations baseline | DA-934 | completed |
| TK-939 | sprint-002-phase-b-outer-loop-consolidation-and-operations | close sprint-002 and hand off phase-c full-workbench cutover | governance handoff | land outer-loop consolidation and typed cli bridge governance baseline | completed |
| TK-940 | sprint-003-phase-c-workflow-studio-and-full-workbench-cutover | plan workflow studio cutover and primary workbench support-truth evidence | workflow studio and support-truth cutover | DA-934 | completed |
| TK-941 | sprint-003-phase-c-workflow-studio-and-full-workbench-cutover | finalize project-112 rollout closeout and delivery evidence handoff | closeout and delivery evidence | plan workflow studio cutover and primary workbench support-truth evidence | completed |

## 4. 依赖产物策略

1. task decomposition 产物优先回链到 project/sprint plan 与 canonical task cards。
2. review lifecycle 产物只在真正进入 review 窗口后生成，不在 bootstrap 阶段预写。
3. closeout / completion audit summary 只在终态窗口创建并回链。

## 5. DoD（project-112-vscode-governance-workbench-rollout）

1. 3 个 sprint 的 plan、task cards、checklist、tasks.csv 与 review scaffold 已标准化落盘。
2. 任务编号、目录结构与命名规则符合 AGENTS 与 governance template 约束。
3. 在正式激活前已有明确的 task-ledger canonicalization 路径，且只需要按顺序激活执行面。

## 6. 里程碑记录

1. 2026-04-16：创建 project-112-vscode-governance-workbench-rollout 全量执行流骨架，覆盖 sprint-001-phase-a-primary-workbench-baseline、sprint-002-phase-b-outer-loop-consolidation-and-operations、sprint-003-phase-c-workflow-studio-and-full-workbench-cutover。
2. 2026-04-17：`project-110` 完成 final closeout 后，`project-112 / sprint-001` 被激活为新的 active primary stream；`TK-936` 切换为 `in_progress`，开始冻结 VS Code primary workbench baseline 与 service-owned task/review seams。
3. 2026-04-17：`project-112 / sprint-001` 在 `CR-003` clean round 与 `DA-937` handoff 后完成 closeout；`sprint-002-phase-b-outer-loop-consolidation-and-operations` 被激活为新的 active primary stream，`TK-938` 切换为 `in_progress`。
4. 2026-04-17：`project-112 / sprint-002` 在 `CR-012` clean round 与 `DA-939` handoff 后完成 closeout；`sprint-003-phase-c-workflow-studio-and-full-workbench-cutover` 被激活为新的 active primary stream，`TK-940` 切换为 `in_progress`。
5. 2026-04-17：`TK-940` 已完成 workflow studio / desktop decision surface / support-truth gate implementation boundary，并产出 `DA-940`；当前 `project-112 / sprint-003` 进入 fresh reviewer CR loop，clean 后继续 `TK-941`。
6. 2026-04-17：latest fresh reviewer round `CR-002` 已 clean `resolved`；`TK-941` 已切换为 `in_progress`，开始写入 sprint-003 exit acceptance packet，并为后续 project-final scoped CR loop 保留 final sprint 作为 active review surface。
7. 2026-04-17：`DA-941` 与 sprint-003 boundary `pnpm run check` 已完成；当前 project 已达到进入 `project-final` fresh reviewer loop 的前置条件，但 final closeout 与 public support-truth cutover 仍待 clean project-final round 放行。
8. 2026-04-17：project-final `CR-003` 已在 README public-surface drift 修复后 clean `resolved`；`project-112` completion audit summary、`DA-942`、delivery registry completed write-back 与 idle current-context 已全部落盘，项目正式切换为 `completed`。

## 7. 里程碑记录入口

1. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md`
