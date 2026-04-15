# sprint-001-additive-diagnostics-consumer-rollout 计划

- Status: completed
- Date: 2026-04-14
- Sprint Goal: 初始化 launch diagnostics consumer projection rollout baseline，并冻结第一阶段 implementation boundary。
- Project: `project-103-cli-exec-additive-diagnostics-consumer-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-002-additive-diagnostics-consumer/tasks/DA-849-cli-exec-additive-diagnostics-consumer-promotion-cutover.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/shared-launch-diagnostics-projection-and-consumer-surfaces.md`
  - `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/plan.md`

## 1. Scope

1. 建立 `launch_diagnostics` companion 的 rollout baseline，并固定 snake_case canonical naming。
2. 保持 producer truth、probe-owned preserved facts 与 additive-only evidence 的边界不变。
3. 为 `sprint-002` 的 consumer surface adoption 与 scenario evidence 准备 activation-ready handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-858 | implement cli-exec additive diagnostics consumer rollout baseline | DA-849 | completed |
| TK-872 | project snake_case launch_diagnostics companion from shared producer truth without adding minimum fields | TK-858 | completed |
| TK-873 | sprint-001 exit acceptance and sprint-002 activation handoff | TK-858、TK-872、activation-time local CR-001 | completed |

## 3. Exit Criteria

1. diagnostics consumer baseline 与 snake_case companion projection 已成为真实 implementation boundary。
2. `project-103` 当前已完成 `sprint-001` baseline，并将 `sprint-002` 激活为新的 primary execution stream。
3. `sprint-001` 的两轮 CR 已 clean 收口，handoff boundary 已交接给 `sprint-002`。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 推荐在 `project-102` ownership guardrail 起步后再激活 `project-103`。
3. 当前 sprint 不得把 additive diagnostics 升格为新的 minimum contract fields。
4. 2026-04-14：`project-102` final closeout 完成后，当前 sprint 已被激活为新的 primary execution surface；随后完成 `TK-858 / TK-872` implementation、`CR-001` accepted-finding 修复与 `CR-002` clean recheck fallback。
