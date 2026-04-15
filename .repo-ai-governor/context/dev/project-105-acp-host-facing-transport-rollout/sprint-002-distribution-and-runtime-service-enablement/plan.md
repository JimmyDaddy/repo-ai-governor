# sprint-002-distribution-and-runtime-service-enablement 计划

- Status: completed
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
| TK-885 | integrate connect doctor verify readiness composition for acp_exec and host next-actions | TK-884 | completed |
| TK-886 | enable packaged-distribution and runtime-service surfaces behind explicit ACP boundaries | TK-885 | completed |
| TK-887 | sprint-002 exit acceptance and sprint-003 activation handoff | TK-885、TK-886、latest fresh reviewer clean round | completed |

## 3. Exit Criteria

1. `acp_exec` readiness composition 已成为真实 rollout boundary。
2. packaged distribution/runtime-service enablement 已被明确限制在 ACP-specific boundaries 内。
3. `CR-001` repair round 与 `CR-002` clean recheck 已全部 resolved，且 `sprint-003` handoff 已激活完成。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 不得把 packaged distribution/runtime-service enablement 表述成已完成 public support。
3. `TK-887` 只负责 sprint handoff，clean-room verify 与 support/docs uplift 留给 `sprint-003`。
4. 2026-04-15：`sprint-001` clean closeout 已完成，当前 sprint 已切换为 active primary surface；`TK-885` 进入 `in_progress`，并先本地预留 `CR-001` 再开始 ACP readiness composition 与 runtime-service enablement implementation。
5. 2026-04-15：`TK-885` 与 `TK-886` 的 implementation 已完成。当前 ACP probe 会消费 host verification evidence，并将 packaged-distribution/runtime-service posture 投影到 onboarding、diagnostics 与 ACP-specific next-actions，同时继续保持 `acp_exec` fail-closed 且不回写 `cli_exec` truth。下一步进入 `CR-001` fresh reviewer loop。
6. 2026-04-15：`CR-001` 已修复收口，`CR-002` latest fresh reviewer round clean。当前 sprint-002 已完成 closeout，`TK-887` 收口完成，并将 `sprint-003` 激活为新的 primary execution surface。
