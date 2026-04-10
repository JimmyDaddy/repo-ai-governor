# project-074-transport-selection-authority-solution-review 计划

- Status: completed
- Date: 2026-04-09
- Stage Mapping: technical solution review
- Phase Mapping: runtime-agent-projection follow-up draft review / lifecycle write-back
- Upstream:
  - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
  - `docs/local-adoption-playbook.md`
  - `docs/support-matrix.md`

## 1. 目标

1. 对 `transport-selection-authority-and-strict-routing` follow-up draft 执行正式 technical-solution review。
2. 将 review 结论沉淀为 canonical artifact，并在需要时把 lifecycle 从 `draft/review_pending` 推进到当前轮次可支持的最高 review 状态。
3. 在 blocking finding 驱动下修订 draft，并用同一 canonical review artifact 执行 `re-review-after-updates`。
4. 在同一 docs-only 窗口完成 task ledger、completion audit 与 idle context 收口。

## 2. Sprint 细化

## 2.1 sprint-001-draft-review-and-lifecycle-writeback

- Status: completed
- Sprint Goal: 完成 draft review、lifecycle write-back 与 docs-only closeout。
- Task Package: `TK-718`、`TK-719`

## 2.2 sprint-002-draft-remediation-and-rereview

- Status: completed
- Sprint Goal: 修订 draft 以清除 blocking findings，复用 canonical review artifact 做 re-review，并完成最终 lifecycle / closeout 写回。
- Task Package: `TK-720`、`TK-721`、`TK-722`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-718 | sprint-001 | review transport-selection-authority follow-up technical solution draft | docs/review | draft + runtime-agent-projection formal docs | completed |
| TK-719 | sprint-001 | finalize project-074 closeout and restore idle context | closeout/final-audit | TK-718 | completed |
| TK-720 | sprint-002 | remediate transport-selection-authority draft against blocking review findings | docs/draft | TK-718 + canonical review artifact | completed |
| TK-721 | sprint-002 | re-review updated transport-selection-authority draft and update lifecycle approval state | docs/review + lifecycle | TK-720 | completed |
| TK-722 | sprint-002 | finalize project-074 sprint-002 closeout and restore idle context | closeout/final-audit | TK-721 | completed |

## 4. 依赖产物策略

1. 本项目负责 `review-draft-solution` 与必要时的 `re-review-after-updates / approve-reviewed-solution`，但不进入 promotion cutover。
2. blocking findings、non-blocking suggestions 与 promotion interlocks 必须拆开记录，避免 review artifact 混成实现方案。
3. 本项目为 docs-only review 窗口，不修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码。
4. `re-review-after-updates` 必须复用 `sprint-001` 下已有 canonical review artifact，而不是新增平行 review 文件。
5. `remote_api` 的 public support wording 只有在 draft 补齐 evidence gate 后，才允许在后续 delivery change 中升级。

## 5. DoD（project-074）

1. draft 已修订并明确 onboarding canonical truth slot 与 support-truth evidence gate。
2. canonical technical-solution review artifact 已完成 re-review disposition，并在 clean 情况下推进到 `approved`；若仍不 clean，则保持 `review_pending` 并明确阻断项。
3. lifecycle registry 与 canonical `review_paths` 已同步到当前 review 结论，且 `final_paths` 仍保持空值。
4. project/sprint/tasks/completion-audit/current-context/history 已恢复到最终 completed / idle 真值。

## 6. 里程碑记录

1. 2026-04-09：创建 `project-074 / sprint-001`，用于审查 `transport-selection-authority-and-strict-routing` follow-up draft。
2. 2026-04-09：`TK-718` 已完成，review artifact 判定该 draft 仍有 2 条 blocking finding，当前 lifecycle 已推进到 `review_pending`。
3. 2026-04-09：`TK-719` 已完成 docs-only closeout，`project-074` 正式进入 `completed`，并回链 completion audit summary。
4. 2026-04-09：因用户要求直接修订 draft 并继续复审，已激活 `sprint-002-draft-remediation-and-rereview`，继续沿用原 canonical review artifact 做同一 solution 的下一轮 review。
5. 2026-04-09：`TK-720 / TK-721` 已完成，draft 已清除两条 blocking finding，canonical review artifact 与 lifecycle 已推进到 `approved`，但 formal promotion 仍未开始。
6. 2026-04-09：`TK-722` 已完成 docs-only closeout，`project-074` 已恢复到最终 `completed` 真值；当前 handoff 为“已批准、待 promotion”。

## 7. 里程碑记录入口

1. [project-074-transport-selection-authority-solution-review-completion-audit-summary.md](./project-074-transport-selection-authority-solution-review-completion-audit-summary.md)
