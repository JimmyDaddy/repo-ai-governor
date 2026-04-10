# sprint-002-capability-model-and-plan-workflow-cutover 计划

- Status: completed
- Date: 2026-04-10
- Project: `project-077-session-main-command-model-rollout`
- Sprint Goal: 冻结 capability interaction model contract，并完成 `/plan` 产品化固定工作流、`/plan sync` deterministic bridge 与 planning routing cutover。

## 1. Task Package

1. `TK-729` freeze session.main capability interaction model contract
2. `TK-730` cut over capability catalog explainer and discoverability to the new plan workflow model
3. `TK-731` cut over planning routing and slash surfaces to `/plan` workflow plus `/plan sync` bridge

## 2. Exit Criteria

1. orchestration-owned capability descriptor 已补齐 `interactionModel / primaryEntry / backingExecution` 等元数据，并明确 `run`=`pending_existence_review`、`verify` 不再公开。
2. capability catalog、explainer、help appendix、slash discoverability 对 `/plan`、`/plan sync`、`@planner` 的语义描述一致。
3. 自然语言 planning request 不再桥接到裸 `plan --output pretty`；`/plan <goal>` 进入产品化 planning workflow，`/plan sync` 继续承接 deterministic ledger action。

## 3. Milestones

1. 2026-04-10：作为 `project-077` 的首个 implementation sprint 被激活，并成为当前 primary execution surface。
2. 2026-04-10：`TK-729` 切换为 `in_progress`，开始 capability contract 与 catalog truth cutover。
3. 2026-04-10：`TK-729 ~ TK-731` 全部完成，`CR-001` 关闭 lower-case 参数漂移后收口为 `resolved`，`sprint-002` 正式完成并将 handoff 到 `sprint-003`。
