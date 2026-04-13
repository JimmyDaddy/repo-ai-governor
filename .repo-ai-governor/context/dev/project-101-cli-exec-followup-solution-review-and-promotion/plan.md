# project-101-cli-exec-followup-solution-review-and-promotion 计划

- Status: completed
- Date: 2026-04-13
- Stage Mapping: technical solution review + promotion
- Phase Mapping: cli_exec follow-up solution review loop / promotion cutover / follow-up delivery handoff
- Upstream:
  - `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-onboarding-and-adoption-readiness-productization-technical-solution.md`
  - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 1. 目标

1. 依次完成 4 份 `cli_exec` follow-up draft 的 fresh-review loop、promotion cutover 与 follow-up delivery handoff。
2. 在同一 umbrella project 下保持 `runtime.agent-projection` formal docs、lifecycle / delivery / manifest 与 task ledger 的同步。
3. 在本轮只完成 docs/review/registry/promotion，不承接任何 runtime 代码实现，并在 project closeout 后恢复 `idle` primary context。

## 2. Sprint 细化

## 2.1 sprint-001-launch-authoring-contract-tests

- Status: completed
- Sprint Goal: 完成 adapter launch authoring contract-tests 方案的 review、promotion 与 rollout handoff。
- Task Package: `TK-844`、`TK-845`、`TK-846`、`TK-847`

## 2.2 sprint-002-additive-diagnostics-consumer

- Status: completed
- Sprint Goal: 完成 additive diagnostics consumer productization 方案的 review、promotion 与 rollout handoff。
- Task Package: `TK-848`、`TK-849`、`TK-850`

## 2.3 sprint-003-onboarding-adoption-readiness

- Status: completed
- Sprint Goal: 完成 onboarding/adoption readiness 方案的 review、promotion 与 rollout handoff。
- Task Package: `TK-851`、`TK-852`、`TK-853`

## 2.4 sprint-004-acp-host-facing-transport-formalization

- Status: completed
- Sprint Goal: 完成 ACP host-facing transport formalization 方案的 review、promotion 与最终 project closeout。
- Task Package: `TK-854`、`TK-855`、`TK-856`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-844 | sprint-001 | activate project-101 and freeze sprint-001 launch-authoring review promotion boundary | governance/bootstrap | plan + context activation | completed |
| TK-845 | sprint-001 | review cli-exec adapter launch authoring contract tests technical solution draft | docs/review + lifecycle | TK-844 | completed |
| TK-846 | sprint-001 | promote cli-exec adapter launch authoring contract tests solution and create rollout handoff | promotion/governance | TK-845 | completed |
| TK-847 | sprint-001 | finalize sprint-001 closeout and activate sprint-002 | closeout/handoff | TK-846 | completed |
| TK-848 | sprint-002 | review cli-exec additive diagnostics consumer productization draft | docs/review + lifecycle | TK-847 | completed |
| TK-849 | sprint-002 | promote cli-exec additive diagnostics consumer solution and create rollout handoff | promotion/governance | TK-848 | completed |
| TK-850 | sprint-002 | finalize sprint-002 closeout and activate sprint-003 | closeout/handoff | TK-849 | completed |
| TK-851 | sprint-003 | review cli-exec onboarding and adoption readiness productization draft | docs/review + lifecycle | TK-850 | completed |
| TK-852 | sprint-003 | promote cli-exec onboarding and adoption readiness solution and create rollout handoff | promotion/governance | TK-851 | completed |
| TK-853 | sprint-003 | finalize sprint-003 closeout and activate sprint-004 | closeout/handoff | TK-852 | completed |
| TK-854 | sprint-004 | review ACP host-facing transport formalization draft | docs/review + lifecycle | TK-853 | completed |
| TK-855 | sprint-004 | promote ACP host-facing transport formalization solution and create rollout handoff | promotion/governance | TK-854 | completed |
| TK-856 | sprint-004 | finalize project-101 closeout and restore idle context | closeout/final-audit | TK-855 | completed |

## 4. 依赖产物策略

1. 每个 sprint 先跑 `technical-solution-review` 的 fresh reviewer loop，最新一轮 clean 后才允许推进到 promotion。
2. promotion 只写入新的 ADR `final_paths`；`runtime.agent-projection` 共享 overview / contract 路径继续复用既有 manifest 与 module registry truth，不在多个 active solution 间重复占有。
3. 4 个 solution 的 delivery ownership 都收口为 `followup_required`，每次 promotion 同窗创建真实 follow-up project skeleton，并把 planned stream 写回 `current-context.md`。
4. 本项目是 docs-only review/promotion 窗口，不修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 可执行代码。

## 5. DoD（project-101）

1. 4 个 target solution 均已从 `draft` 推进到 `active`，且 review artifact、lifecycle、delivery、module registry 与 manifest 同步完成。
2. `project-102 ~ project-105` follow-up rollout skeleton 均已创建，并在 `current-context.md -> Planned Follow-Up Streams` 可见。
3. project / sprint / task ledger / artifact registry / completed history / current-context 已恢复到最终 `completed / idle` 真值。

## 6. 里程碑记录

1. 2026-04-13：创建 `project-101` 与 4 个顺序 sprint 骨架，固定 review / promotion 执行顺序与任务编号。
2. 2026-04-13：`TK-844` 已完成，`project-101 / sprint-001` 已被激活为 primary execution surface，fresh reviewer loop 从 `TK-845` 开始。
3. 2026-04-13：`TK-845 ~ TK-847` 已完成，launch-authoring contract-tests solution 已 promoted 为 active，并把 `project-102` 登记为 planned follow-up stream；`sprint-002` 现已接管为 primary review/promotion surface。
4. 2026-04-13：`TK-848` 已完成两轮 fresh reviewer loop；additive diagnostics consumer draft 在收敛 probe/invoke split、formal naming 映射与 promotion scope 后已进入 `approved`，下一步进入 `TK-849` promotion cutover。
5. 2026-04-13：`TK-849` 已完成 diagnostics-consumer formal docs、delivery handoff、`project-103` planned rollout skeleton 与 promotion gate 收口；当前进入 `TK-850` sprint closeout。
6. 2026-04-13：`TK-850` 已完成，`sprint-003` 现已接管为 primary execution surface，并进入 `TK-851` 的 fresh reviewer loop。
7. 2026-04-13：`TK-851 ~ TK-852` 已完成；onboarding/adoption readiness solution 已 promoted 为 active，并把 `project-104` 登记为 planned follow-up stream；当前进入 `TK-853` sprint closeout。
8. 2026-04-13：`TK-854 ~ TK-855` 已完成；ACP host-facing solution 已 promoted 为 active，并把 `project-105` 登记为 planned follow-up stream；当前进入 `TK-856` final closeout。
9. 2026-04-13：`TK-856` 已完成，`project-101` 已恢复 `idle` primary context，并将 `stream-project-101-sprint-004` 写回 completed history。

## 7. 里程碑记录入口

1. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/project-101-cli-exec-followup-solution-review-and-promotion-completion-audit-summary.md`
