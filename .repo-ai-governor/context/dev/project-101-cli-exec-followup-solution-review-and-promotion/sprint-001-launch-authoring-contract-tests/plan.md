# sprint-001-launch-authoring-contract-tests 计划

- Status: completed
- Date: 2026-04-13
- Sprint Goal: 完成 adapter launch authoring contract-tests draft 的 review、promotion 与 project-102 rollout handoff。
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Upstream:
  - `.repo-ai-governor/draft/cli-exec-adapter-launch-authoring-contract-tests-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`

## 1. Scope

1. 对 `technical-solution.cli-exec-adapter-launch-authoring-contract-tests` 执行 fresh reviewer review loop，并在 clean 后推进到 `approved`。
2. 将 adapter-owned launch truth invariants、failure-path preservation taxonomy 与新 ADR formalize 到 `runtime.agent-projection`。
3. 为 `project-102-cli-exec-launch-authoring-contract-tests-rollout` 创建 planned follow-up stream，并完成 sprint closeout。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-844 | activate project-101 and freeze sprint-001 launch-authoring review promotion boundary | plan + context activation | completed |
| TK-845 | review cli-exec adapter launch authoring contract tests technical solution draft | TK-844 | completed |
| TK-846 | promote cli-exec adapter launch authoring contract tests solution and create rollout handoff | TK-845 | completed |
| TK-847 | finalize sprint-001 closeout and activate sprint-002 | TK-846 | completed |

## 3. Exit Criteria

1. canonical technical-solution review artifact 已 clean，并将 target solution 推进到 `approved`。
2. promotion 已完成 lifecycle / delivery / module registry / manifest / ADR 同步，且 delivery handoff 指向真实的 `project-102` planned stream。
3. sprint-001 task ledger、review、artifact registry 与 current-context 已同步到 `completed -> sprint-002 active`。

## 4. Sprint Notes

1. 只允许对 `agent-invoke-liveness` 与 `adapter-health-and-route-probe` 做 additive clarification，不把本方案扩大成全量 adapter test strategy。
2. 本 sprint 的 `final_paths` 只允许包含新的 launch-authoring ADR；共享 contract / overview 路径不进入 lifecycle 专属 `final_paths`。
3. fresh reviewer 固定使用 `gpt-5.4 / xhigh / default`，每轮使用新 reviewer。
4. 2026-04-13：canonical review artifact clean 后，solution 已 promoted 为 `active`，`project-102` planned rollout skeleton 已创建，sprint-001 收口为 `completed`。
