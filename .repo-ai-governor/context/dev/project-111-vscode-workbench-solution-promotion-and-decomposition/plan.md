# project-111-vscode-workbench-solution-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-16
- Stage Mapping: technical solution promotion / follow-up decomposition / closeout
- Phase Mapping: formal module landing / delivery handoff / project closeout
- Upstream:
  - `.repo-ai-governor/draft/vscode-full-governance-workbench-and-task-driven-orchestration-technical-solution.md`
  - `.repo-ai-governor/draft/approved_solution_review_vscode-full-governance-workbench-and-task-driven-orchestration.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. 目标

1. 完成 `technical-solution.vscode-full-governance-workbench-and-task-driven-orchestration` 的 formal promotion cutover。
2. 将 follow-up rollout 拆解为真实 planned stream `project-112-vscode-governance-workbench-rollout`。
3. 完成 `project-111` closeout 与 completion audit。

## 2. Sprint 细化

## 2.1 sprint-001-promotion-and-rollout-handoff

- Status: completed
- Sprint Goal: 完成 VS Code full governance workbench solution 的 promotion、planned rollout decomposition 与 closeout
- Task Package: `TK-933、TK-934、TK-935`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-933 | sprint-001-promotion-and-rollout-handoff | promote approved vscode full governance workbench solution into formal docs and registries | promotion-cutover | approved review artifact | completed |
| TK-934 | sprint-001-promotion-and-rollout-handoff | decompose vscode governance workbench rollout into planned project-112 and activation handoff | planning/followup-decomposition | TK-933 | completed |
| TK-935 | sprint-001-promotion-and-rollout-handoff | finalize project-111 closeout and completion audit | closeout/audit | TK-934 | completed |

## 4. 依赖产物策略

1. promotion 只把 approved solution 投影到 formal docs / registries，不把 draft 文件升格为 formal truth。
2. follow-up rollout 必须以真实 `project/sprint/task` surface 写回 delivery registry 与 `current-context.md`，不能停留在口头 handoff。
3. closeout / completion audit summary 只在终态窗口创建并回链。

## 5. DoD（project-111-vscode-workbench-solution-promotion-and-decomposition）

1. approved solution 的 formal promotion cutover 已完成，并把 solution 推进到 `active` lifecycle-managed 状态。
2. delivery handoff 已指向真实 planned follow-up stream `project-112-vscode-governance-workbench-rollout`。
3. `project-111` completion audit summary 已生成，plan / sprint / checklist / tasks.csv / completed-streams-history / current-context 已同步收口。
4. lifecycle / delivery / module registry / manifest / docs-triad / ledger / artifact gates 全部通过。

## 6. 里程碑记录

1. 2026-04-16：创建 `project-111-vscode-workbench-solution-promotion-and-decomposition` 全量执行流骨架，覆盖 `sprint-001-promotion-and-rollout-handoff`。
2. 2026-04-16：完成 `TK-933` promotion cutover，solution 已推进为 `active`，并固定三份唯一 `final_paths`。
3. 2026-04-16：完成 `TK-934` rollout decomposition，`project-112 / sprint-001` 已登记为 planned follow-up stream，`DA-934` 已形成。
4. 2026-04-16：完成 `TK-935` closeout，`project-111` completion audit summary 已生成并回链。

## 7. 里程碑记录入口

1. [project-111-vscode-workbench-solution-promotion-and-decomposition-completion-audit-summary.md](./project-111-vscode-workbench-solution-promotion-and-decomposition-completion-audit-summary.md)
