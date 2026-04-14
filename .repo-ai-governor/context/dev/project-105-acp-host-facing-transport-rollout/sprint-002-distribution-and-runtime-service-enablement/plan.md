# sprint-002-distribution-and-runtime-service-enablement 计划

- Status: active
- Date: 2026-04-14
- Sprint Goal: 推进 `acp_exec` readiness composition、packaged distribution 与 runtime-service enablement。
- Project: `project-105-acp-host-facing-transport-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 1. Scope

1. 将 `connect / doctor / verify` 的 ACP readiness composition 落到真实 implementation boundary。
2. 推进 packaged distribution 与 runtime-service surfaces，但继续受 explicit ACP boundaries 约束。
3. 为 `sprint-003` 的 clean-room verify 与 support/docs truth uplift 准备 activation-ready handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-885 | integrate connect doctor verify readiness composition for acp_exec and host next-actions | TK-884 | in_progress |
| TK-886 | enable packaged-distribution and runtime-service surfaces behind explicit ACP boundaries | TK-885 | planned |
| TK-887 | sprint-002 exit acceptance and sprint-003 activation handoff | TK-885、TK-886、activation-time local CR-001 | planned |

## 3. Exit Criteria

1. `acp_exec` readiness composition 已成为真实 rollout boundary。
2. packaged distribution/runtime-service enablement 已被明确限制在 ACP-specific boundaries 内。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 `sprint-003` handoff 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 不得把 packaged distribution/runtime-service enablement 表述成已完成 public support。
3. `TK-887` 只负责 sprint handoff，clean-room verify 与 support/docs uplift 留给 `sprint-003`。
4. 2026-04-15：`sprint-001` clean closeout 已完成，当前 sprint 已切换为 active primary surface；`TK-885` 进入 `in_progress`，并先本地预留 `CR-001` 再开始 ACP readiness composition 与 runtime-service enablement implementation。
