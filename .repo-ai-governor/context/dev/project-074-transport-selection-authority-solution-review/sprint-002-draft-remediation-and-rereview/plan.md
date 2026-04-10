# sprint-002-draft-remediation-and-rereview 计划

- Status: completed
- Date: 2026-04-09
- Sprint Goal: 修订 transport-selection-authority follow-up draft，清除上一轮 blocking findings，并在同一窗口完成 re-review、lifecycle 更新与 docs-only closeout。
- Upstream:
  - `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
  - `apps/cli/src/runtime/agent-onboarding-runtime.ts`
  - `docs/local-adoption-playbook.md`
  - `docs/support-matrix.md`

## 1. Scope

1. 按上一轮 review artifact 的 blocking findings 直接修订 draft。
2. 复用已有 canonical review artifact 做 `re-review-after-updates`，逐条记录 disposition。
3. 根据复审结果回写 lifecycle registry，并完成 sprint/project closeout。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
|---|---|---|---|
| TK-720 | remediate transport-selection-authority draft against blocking review findings | TK-718 + canonical review artifact | completed |
| TK-721 | re-review updated transport-selection-authority draft and update lifecycle approval state | TK-720 | completed |
| TK-722 | finalize project-074 sprint-002 closeout and restore idle context | TK-721 | completed |

## 3. Sprint Notes

1. 本 sprint 是 docs-only remediation / re-review 窗口，不修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码。
2. `re-review-after-updates` 必须继续使用 `sprint-001` 下的 canonical review artifact，不得创建并行 `solution_review_*` 文件。
3. draft 必须明确区分 runtime/contract-level transport support 与 adopter-facing public support wording，避免再次把 evidence gate 与 contract support 混写。
4. 若 blocking finding 全部收口，本 sprint 可以把 lifecycle 推进到 `approved`，但仍不得进入 `technical-solution-promotion` 的 formal cutover。
5. 本 sprint 的最终 handoff 是“technical solution 已批准，但仍未 promotion / active”，因此 closeout 时必须把这一点写进 completion audit。
