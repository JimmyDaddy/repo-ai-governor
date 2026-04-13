# sprint-001-onboarding-adoption-readiness-rollout 计划

- Status: planned
- Date: 2026-04-14
- Sprint Goal: 初始化 onboarding/adoption readiness rollout baseline，并冻结第一阶段 implementation boundary。
- Project: `project-104-cli-exec-onboarding-adoption-readiness-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`
  - `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`

## 1. Scope

1. 建立 readiness composition baseline，并固定 onboarding-owned `verification_status / diagnostic_summary / next_action(s)`。
2. 保持 canonical onboarding truth、probe truth 与 additive launch evidence 的 ownership split。
3. 为 `sprint-002` 的 playbook readback 与 support-evidence prep 准备 activation-ready handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-859 | implement cli-exec onboarding and adoption readiness rollout baseline | DA-852 | planned |
| TK-877 | compose verification_status diagnostic_summary and next_action(s) from canonical onboarding probe truth | TK-859 | planned |
| TK-878 | sprint-001 exit acceptance and sprint-002 activation handoff | TK-859、TK-877、activation-time local CR-001 | planned |

## 3. Exit Criteria

1. readiness composition baseline 已成为真实 implementation boundary。
2. `project-104` 仍保持 planned stream，不会因预建 `CR-xxx` 被误聚合成 `active`。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 `sprint-002` handoff 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 推荐在 `project-103` diagnostics consumer truth 起步后再激活 `project-104`。
3. 当前 sprint 不得让 playbook/support wording 反向成为新的 runtime truth source。
