# sprint-002-draft-remediation-and-rereview 计划

- Status: completed
- Date: 2026-04-11
- Sprint Goal: 修订 local-user-config draft，清除上一轮 blocking findings，并在同一窗口完成 re-review、lifecycle approval 与 docs-only closeout。
- Upstream:
  - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_local-user-config-and-secret-backed-command-configuration.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 按上一轮 review artifact 的 blocking findings 直接修订 draft。
2. 复用已有 canonical review artifact 做 `re-review-after-updates`，逐条记录 disposition。
3. 根据复审结果回写 lifecycle registry，并完成 sprint/project closeout。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-781 | remediate local-user-config draft against blocking review findings | TK-779 + canonical review artifact | completed |
| TK-782 | re-review updated local-user-config draft and update lifecycle approval state | TK-781 | completed |
| TK-783 | finalize project-087 sprint-002 closeout and restore idle context | TK-782 | completed |

## 3. Sprint Notes

1. 本 sprint 是 docs-only remediation / re-review 窗口，不修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码。
2. `re-review-after-updates` 必须继续使用 `sprint-001` 下的 canonical review artifact，不得创建并行 `solution_review_*` 文件。
3. draft 必须明确 formal landing、companion-solution relationship 与 `user-config -> canonical onboarding truth` 的映射，避免 review 结论继续卡在 promotion-ready boundary 不清。
4. 若 blocking finding 全部收口，本 sprint 可以把 lifecycle 推进到 `approved`，但仍不得进入 `technical-solution-promotion` 的 formal cutover。
5. 本 sprint 的最终 handoff 是“technical solution 已批准，但仍未 promotion / active”，因此 closeout 时必须把这一点写进 completion audit。
