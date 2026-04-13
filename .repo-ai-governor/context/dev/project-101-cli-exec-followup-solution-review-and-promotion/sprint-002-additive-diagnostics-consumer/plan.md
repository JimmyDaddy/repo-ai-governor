# sprint-002-additive-diagnostics-consumer 计划

- Status: completed
- Date: 2026-04-13
- Sprint Goal: 完成 additive diagnostics consumer productization draft 的 review、promotion 与 project-103 rollout handoff。
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Upstream:
  - `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`

## 1. Scope

1. 对 `technical-solution.cli-exec-additive-diagnostics-consumer-productization` 执行 fresh reviewer review loop，并在 clean 后推进到 `approved`。
2. formalize 统一 `launch_diagnostics` consumer projection 与 shared consumer guidance，不把 additive fields 升格为 minimum contract。
3. 为 `project-103-cli-exec-additive-diagnostics-consumer-rollout` 创建 planned follow-up stream，并完成 sprint closeout。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-848 | review cli-exec additive diagnostics consumer productization draft | sprint-001 closeout | completed |
| TK-849 | promote cli-exec additive diagnostics consumer solution and create rollout handoff | TK-848 | completed |
| TK-850 | finalize sprint-002 closeout and activate sprint-003 | TK-849 | completed |

## 3. Exit Criteria

1. canonical technical-solution review artifact 已 clean，并将 target solution 推进到 `approved`。
2. promotion 已完成 lifecycle / delivery / module registry / manifest / ADR 同步，且 handoff 指向真实的 `project-103` planned stream。
3. sprint-002 task ledger、review、artifact registry 与 current-context 已同步到 `completed -> sprint-003 active`。

## 4. Sprint Notes

1. 本 sprint 依赖 `sprint-001` 已 formalize 的 adapter launch-authoring ownership 边界。
2. 只允许更新 `agent-onboarding` 与 `adapter-health-and-route-probe` 的 additive consumer guidance。
3. public support wording、availability truth 与 transport uplift 继续保持后置。
4. 2026-04-13：已承接 sprint-001 closeout handoff，并完成 `TK-848` 的两轮 fresh reviewer loop；draft 已进入 `approved`。
5. 2026-04-13：`TK-849` 已完成 diagnostics-consumer promotion cutover、`project-103` planned rollout skeleton 与 gate 收口；当前进入 `TK-850` sprint closeout。
6. 2026-04-13：`TK-850` 已完成，sprint-002 收口为 `completed` 并将 primary execution surface 切换到 `sprint-003`。
