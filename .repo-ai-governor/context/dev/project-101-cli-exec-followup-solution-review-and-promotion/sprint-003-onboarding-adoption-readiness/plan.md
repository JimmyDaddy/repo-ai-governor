# sprint-003-onboarding-adoption-readiness 计划

- Status: completed
- Date: 2026-04-13
- Sprint Goal: 完成 onboarding/adoption readiness draft 的 review、promotion 与 project-104 rollout handoff。
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Upstream:
  - `.repo-ai-governor/draft/cli-exec-onboarding-and-adoption-readiness-productization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-additive-diagnostics-consumer-productization-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `docs/local-adoption-playbook.md`
  - `docs/support-matrix.md`

## 1. Scope

1. 对 `technical-solution.cli-exec-onboarding-and-adoption-readiness-productization` 执行 fresh reviewer review loop，并在 clean 后推进到 `approved`。
2. formalize `connect / doctor / verify` readiness evidence、next-action chain 与 adoption gating，不在本窗口 uplift public support wording。
3. 为 `project-104-cli-exec-onboarding-adoption-readiness-rollout` 创建 planned follow-up stream，并完成 sprint closeout。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-851 | review cli-exec onboarding and adoption readiness productization draft | sprint-002 closeout | in_progress |
| TK-852 | promote cli-exec onboarding and adoption readiness solution and create rollout handoff | TK-851 | completed |
| TK-853 | finalize sprint-003 closeout and activate sprint-004 | TK-852 | completed |

## 3. Exit Criteria

1. canonical technical-solution review artifact 已 clean，并将 target solution 推进到 `approved`。
2. promotion 已完成 lifecycle / delivery / module registry / manifest / ADR 同步，且 handoff 指向真实的 `project-104` planned stream。
3. sprint-003 task ledger、review、artifact registry 与 current-context 已同步到 `completed -> sprint-004 active`。

## 4. Sprint Notes

1. 本 sprint 依赖 `sprint-002` 已 formalize 的 launch diagnostics consumer truth。
2. 只允许对 `agent-onboarding` 与 `adapter-health-and-route-probe` 做 readiness/additive clarification，不直接改写 `docs/support-matrix.md` 正式支持声明。
3. `docs_playbook` consumer surface 只进入 delivery handoff 与 planned rollout，不在本 sprint 直接宣称 adopter docs 已 uplift 完成。
4. 2026-04-13：已承接 sprint-002 closeout handoff，进入 `TK-851` review baseline 建立与 fresh reviewer loop 准备阶段。
5. 2026-04-13：`TK-851` 已完成两轮 fresh reviewer loop 并 clean 通过；当前进入 `TK-852` promotion cutover。
6. 2026-04-13：`TK-852` 已完成 formal docs、delivery handoff、`project-104` planned rollout skeleton、artifact registration 与 promotion gate 收口；当前进入 `TK-853` closeout。
7. 2026-04-13：`TK-853` 已完成；sprint-003 现已关闭并将 primary execution surface 交接给 `sprint-004-acp-host-facing-transport-formalization`。
