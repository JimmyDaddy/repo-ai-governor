# sprint-001-acp-host-facing-transport-rollout 计划

- Status: planned
- Date: 2026-04-14
- Sprint Goal: 初始化 ACP host-facing transport rollout baseline，并冻结第一阶段 implementation boundary。
- Project: `project-105-acp-host-facing-transport-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
  - `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/plan.md`

## 1. Scope

1. 建立 `acp_exec` host-facing transport baseline，并固定 fail-closed separation from `cli_exec`。
2. 将 `acp_host_companion` 作为 projection-owned carrier 落到真实 implementation boundary。
3. 为 `sprint-002` 的 packaged distribution/runtime-service enablement 准备 activation-ready handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-860 | implement ACP host-facing transport rollout baseline | DA-855 | planned |
| TK-882 | implement explicit acp_exec transport routing and fail-closed separation from cli_exec | TK-860 | planned |
| TK-883 | project acp_host_companion carrier without polluting session or continuation canonical truth | TK-882 | planned |
| TK-884 | sprint-001 exit acceptance and sprint-002 activation handoff | TK-860、TK-882、TK-883、activation-time local CR-001 | planned |

## 3. Exit Criteria

1. `acp_exec` distinct transport truth 与 `acp_host_companion` carrier 已成为真实 implementation boundary。
2. `project-105` 仍保持 planned stream，不会因预建 `CR-xxx` 被误聚合成 `active`。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 `sprint-002` handoff 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 不得把 ACP 回写成 `cli_exec` success，也不得污染 session/continuation canonical truth。
3. 默认排在 `project-104` 之后激活，除非用户单独改优先级。
