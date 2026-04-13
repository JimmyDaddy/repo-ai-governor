# project-096-cli-exec-runtime-solution-review 计划

- Status: completed
- Date: 2026-04-13
- Stage Mapping: technical solution review
- Phase Mapping: cli-exec runtime draft review / lifecycle write-back / docs-only closeout
- Upstream:
  - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/transport-selection-authority-and-strict-transport-routing.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`

## 1. 目标

1. 对 `cli-exec-runtime-hardening-and-explicit-acp-extension-seam` draft 执行正式 technical-solution review。
2. 将 review 结论沉淀为 canonical artifact，并把 lifecycle 同步到本轮可支持的最高 review 状态。
3. 在同一 docs-only 窗口完成 task ledger、completion audit 与 idle context 收口。

## 2. Sprint 细化

## 2.1 sprint-001-draft-review-and-lifecycle-writeback

- Status: completed
- Sprint Goal: 完成 cli-exec runtime draft review、lifecycle write-back 与 docs-only closeout。
- Task Package: `TK-833`、`TK-834`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-833 | sprint-001 | review cli-exec runtime hardening and explicit ACP extension seam technical solution draft | docs/review + lifecycle | draft + formal module docs | completed |
| TK-834 | sprint-001 | finalize project-096 closeout and restore idle context | closeout/final-audit | TK-833 | completed |

## 4. 依赖产物策略

1. 本项目只负责 `approve-reviewed-solution` review 窗口，不进入 promotion cutover。
2. blocking findings、non-blocking suggestions 与 promotion interlocks 必须拆开记录，避免 review artifact 变成实现设计文档。
3. 本项目为 docs-only review 窗口，不修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码。
4. review completed != solution promoted；promotion 仍需独立走 lifecycle / delivery / manifest / module gate。

## 5. DoD（project-096）

1. canonical technical-solution review artifact 已完成，并明确给出 `approved` 结论。
2. lifecycle registry 已将该 solution 推进到 `approved`，`review_paths`、`approved_at` 与 `approved_by` 已写回，`final_paths` 保持空值直到 promotion。
3. project / sprint / tasks / completion audit / current-context / history 已恢复到最终 `completed / idle` 真值。

## 6. 里程碑记录

1. 2026-04-13：创建 `project-096 / sprint-001`，用于审查 `cli-exec-runtime-hardening-and-explicit-acp-extension-seam` draft。
2. 2026-04-13：`TK-833` 已完成，review artifact 判定该 draft 可以进入 `approved`，lifecycle 已同步 write-back。
3. 2026-04-13：`TK-834` 已完成 docs-only closeout，`project-096` 已恢复为最终 `completed`，并回链 completion audit summary。

## 7. 里程碑记录入口

1. [project-096-cli-exec-runtime-solution-review-completion-audit-summary.md](./project-096-cli-exec-runtime-solution-review-completion-audit-summary.md)
