# sprint-001-launch-authoring-contract-tests-rollout 计划

- Status: planned
- Date: 2026-04-14
- Sprint Goal: 初始化 shared launch-authoring contract-test rollout baseline，并冻结第一阶段 implementation boundary。
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-001-launch-authoring-contract-tests/tasks/DA-846-cli-exec-launch-authoring-contract-tests-promotion-cutover.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
  - `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/plan.md`

## 1. Scope

1. 建立 shared launch-authoring harness baseline，并固定 adapter-authored truth 与 shared consumer 的边界。
2. 把 probe/invoke preserved-fact split 与 fallback entrypoint projection coverage 纳入同一实现边界。
3. 为 `sprint-002` 的 full failure-path coverage 准备 activation-ready handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-857 | implement cli-exec launch authoring contract tests rollout baseline | DA-846 | planned |
| TK-867 | split probe invoke preserved-fact assertions and fallback entrypoint projection coverage onto the shared harness | TK-857 | planned |
| TK-868 | sprint-001 exit acceptance and sprint-002 activation handoff | TK-857、TK-867、activation-time local CR-001 | planned |

## 3. Exit Criteria

1. shared harness baseline、probe/invoke split 与 fallback projection 都已成为真实 implementation boundary。
2. `project-102` 仍保持 planned stream，不会因预建 `CR-xxx` 被误聚合成 `active`。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 `sprint-002` handoff 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 推荐在 `project-106` compatibility baseline 起步后再激活 `project-102`。
3. 当前 sprint 不得把 launch-authoring ownership guardrail 扩面成通用 adapter test strategy。
