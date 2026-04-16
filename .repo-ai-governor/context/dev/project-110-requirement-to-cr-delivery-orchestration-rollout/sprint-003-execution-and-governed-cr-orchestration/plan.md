# sprint-003-execution-and-governed-cr-orchestration 计划

- Status: active
- Date: 2026-04-16
- Sprint Goal: 把 task-driven execution、review 与 review-verify 纳入 deliver phase machine
- Project: `project-110-requirement-to-cr-delivery-orchestration-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-109-requirement-to-cr-delivery-solution-review-and-promotion-prep/sprint-001-solution-review-and-promotion-handoff/tasks/DA-915-requirement-to-cr-delivery-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`

## 1. Scope

1. 接入 task-driven run、review、review-verify 与 clean-round recheck 的编排边界。
2. 保持 CR artifact 与 CR-xxx 任务为 authoritative truth，deliver 只保留 orchestration overlay。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-929 | route task-driven execution and governed CR through deliver orchestration | DA-915 | in_progress |
| TK-930 | close sprint-003 and hand off discoverability closeout follow-up | TK-929 | planned |

## 3. Exit Criteria

1. execution/review/review-verify orchestration baseline 已冻结且不与底层 review truth 冲突。
2. sprint-004 discoverability/closeout 输入已收口。

## 4. Sprint Notes

1. 需要 clean round 时应复用 productized delegated CR loop 方向，而不是在 presenter 层发明第二套 verify。
2. `2026-04-17` sprint-002 已在 latest fresh reviewer clean round 后完成 closeout；当前 sprint 被激活为新的 primary execution surface，`TK-929` 切换为 `in_progress`。
