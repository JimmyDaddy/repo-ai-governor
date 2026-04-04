# sprint-001-shared-core-and-actionable-console-baseline 计划

- Status: planned
- Date: 2026-04-05
- Project: `project-048-governance-surface-clients-rollout`
- Sprint Goal: 为 governance surface clients 补齐 shared command/query seam 与 actionable desktop console baseline。

## 1. Task Package

1. `TK-559` freeze governance surface client command query seam and actionable console scope
2. `TK-560` expose desktop hitl recovery actions and execution board hitl inbox query surfaces
3. `TK-561` land worktree editor handoff and actionable console regression acceptance

## 2. Exit Criteria

1. desktop preload/runtime 已暴露 `submitHitlDecision`、`recoverExecution`、`getExecution` 等核心 action seam。
2. `Execution Board` 与 `HITL Inbox` 已拥有 service-owned query model，不再依赖单一大 snapshot。
3. handoff contract 已可打开 worktree/editor/terminal/review doc，并保持回链语义。
4. sprint 台账与 planned follow-up stream 状态保持同步。

## 3. Milestones

1. 2026-04-05：创建 `sprint-001-shared-core-and-actionable-console-baseline` 作为 `project-048` 的首个 planned execution sprint。
2. 2026-04-05：完成 `TK-559 ~ TK-561` 任务卡拆解，并将 `project-048 / sprint-001` 登记到 `current-context.md` planned follow-up streams。
