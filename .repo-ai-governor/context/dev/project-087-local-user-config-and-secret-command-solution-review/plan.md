# project-087-local-user-config-and-secret-command-solution-review 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: technical solution review
- Phase Mapping: local-user-config draft review / remediation / rereview / lifecycle write-back
- Upstream:
  - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`

## 1. 目标

1. 对 `local-user-config-and-secret-backed-command-configuration` draft 执行正式 technical-solution review。
2. 将 review 结论沉淀为 canonical artifact，并把 lifecycle 从 `draft` 推进到本轮可支持的最高 review 状态。
3. 在同一 docs-only 窗口完成 task ledger、completion audit 与 idle context 收口。

## 2. Sprint 细化

## 2.1 sprint-001-draft-review-and-lifecycle-writeback

- Status: completed
- Sprint Goal: 完成 local-user-config draft review、lifecycle write-back 与 docs-only closeout。
- Task Package: `TK-779`、`TK-780`

## 2.2 sprint-002-draft-remediation-and-rereview

- Status: completed
- Sprint Goal: 修订 local-user-config draft，清除 blocking findings，并在同一窗口完成 re-review、lifecycle approval 与 docs-only closeout。
- Task Package: `TK-781`、`TK-782`、`TK-783`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-779 | sprint-001 | review local-user-config and secret-backed command configuration technical solution draft | docs/review + lifecycle | draft + formal module docs | completed |
| TK-780 | sprint-001 | finalize project-087 closeout and restore idle context | closeout/final-audit | TK-779 | completed |
| TK-781 | sprint-002 | remediate local-user-config draft against blocking review findings | docs/draft | TK-779 + canonical review artifact | completed |
| TK-782 | sprint-002 | re-review updated local-user-config draft and update lifecycle approval state | docs/review + lifecycle | TK-781 | completed |
| TK-783 | sprint-002 | finalize project-087 sprint-002 closeout and restore idle context | closeout/final-audit | TK-782 | completed |

## 4. 依赖产物策略

1. 本项目负责 `review-draft-solution` 与必要时的 `re-review-after-updates / approve-reviewed-solution`，但不进入 promotion cutover。
2. blocking findings、non-blocking suggestions 与 promotion interlocks 必须拆开记录，避免 review artifact 混成实现方案。
3. 本项目为 docs-only review 窗口，不修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码。
4. 若后续修订 draft 并继续复审，必须复用本 sprint 下的 canonical review artifact，而不是新增平行 review 文件。

## 5. DoD（project-087）

1. canonical technical-solution review artifact 已完成 re-review disposition，并在 clean 情况下推进到 `approved`。
2. lifecycle registry 已同步到最终 review 结论；`review_paths`、`target_module_ids`、`approved_at` 与 `approved_by` 已写回，`final_paths` 继续保持空值。
3. project/sprint/tasks/completion-audit/current-context/history 已恢复到最终 `completed / idle` 真值。

## 6. 里程碑记录

1. 2026-04-11：创建 `project-087 / sprint-001`，用于审查 `local-user-config-and-secret-backed-command-configuration` draft。
2. 2026-04-11：`TK-779` 已完成，review artifact 判定该 draft 仍有 2 条 blocking finding；lifecycle 已推进到 `review_pending`。
3. 2026-04-11：`TK-780` 已完成 docs-only closeout，`project-087` 已恢复为最终 `completed`，并回链 completion audit summary。
4. 2026-04-11：因用户要求继续推进，已激活 `sprint-002-draft-remediation-and-rereview`，按同一 canonical review artifact 修订 draft 并复审。
5. 2026-04-11：`TK-781 / TK-782` 已完成，draft 已清除两条 blocking finding，canonical review artifact 与 lifecycle 已推进到 `approved`，但 formal promotion 仍未开始。
6. 2026-04-11：`TK-783` 已完成 docs-only closeout，`project-087` 已恢复到最终 `completed` 真值；当前 handoff 为“已批准、待 promotion”。

## 7. 里程碑记录入口

1. [project-087-local-user-config-and-secret-command-solution-review-completion-audit-summary.md](./project-087-local-user-config-and-secret-command-solution-review-completion-audit-summary.md)
