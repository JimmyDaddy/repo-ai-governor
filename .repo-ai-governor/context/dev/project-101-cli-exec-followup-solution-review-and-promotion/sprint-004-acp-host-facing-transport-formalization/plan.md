# sprint-004-acp-host-facing-transport-formalization 计划

- Status: completed
- Date: 2026-04-13
- Sprint Goal: 完成 ACP host-facing transport formalization draft 的 review、promotion 与 project-101 final closeout。
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Upstream:
  - `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`

## 1. Scope

1. 对 `technical-solution.acp-host-facing-transport-formalization` 执行 fresh reviewer review loop，并在 clean 后推进到 `approved`。
2. formalize 显式 ACP transport kind、ACP-local companion state 与 packaging/support gating，不把 ACP 伪装成现有 `cli_exec` truth。
3. 为 `project-105-acp-host-facing-transport-rollout` 创建 planned follow-up stream，并在 promotion clean 后完成 project-101 final closeout。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-854 | review ACP host-facing transport formalization draft | sprint-003 closeout | completed |
| TK-855 | promote ACP host-facing transport formalization solution and create rollout handoff | TK-854 | completed |
| TK-856 | finalize project-101 closeout and restore idle context | TK-855 | completed |

## 3. Exit Criteria

1. canonical technical-solution review artifact 已 clean，并将 ACP solution 推进到 `approved`。
2. promotion 已完成 lifecycle / delivery / module registry / manifest / ADR 同步，且 handoff 指向真实的 `project-105` planned stream。
3. project-101 / sprint-004 已同步到最终 `completed`，`current-context` 恢复 `idle`，同时保留 `project-102 ~ project-105` planned follow-up streams。

## 4. Sprint Notes

1. ACP 必须以独立 transport truth formalize，不复用 `cli_exec` canonical slot。
2. `support-matrix`、packaged distribution 与 runtime-service uplift 只进入 delivery handoff / planned rollout，不在本 sprint 直接完成外部支持声明。
3. `TK-856` 在 clean promotion 后负责 project final closeout、completed history 与 completion audit summary。
4. 2026-04-13：已承接 `TK-853` closeout handoff，进入 `TK-854` review baseline 建立与 fresh reviewer loop 准备阶段。
5. 2026-04-13：`TK-854` 已完成两轮 fresh reviewer loop 并 clean 通过；当前进入 `TK-855` promotion cutover。
6. 2026-04-13：`TK-855` 已完成 ACP host-facing ADR、registry/manifest cutover、`project-105` planned rollout skeleton、artifact registration 与 promotion gates；当前进入 `TK-856` final closeout。
7. 2026-04-13：`TK-856` 已完成 project-101 completion audit、completed history 写回与 `idle` current-context 恢复，sprint-004 正式收口为 `completed`。
