# TK-222 project-020 激活与执行面切换 handoff

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-001-packaging-truthfulness-failure-baseline`

## 1. 任务目标

正式激活 `project-020`，将 active execution surface 从 `project-019 / sprint-002-priority-1-and-2-delivery-planning` 切换到新的 adoption/productization 实现主线。

## 2. Depends On

1. `DA-221`
2. `project-019-product-gap-assessment-completion-audit-summary-sprint-002-priority-1-and-2-delivery-planning.md`

## 3. 预期产物

1. `project-020` skeleton。
2. 更新后的 `current-context.md`。
3. 更新后的 `completed-streams-history.md`。
4. `DA-222`

## 4. 实施计划

1. 创建 `project-020-adoption-productization-and-upgrade-ux` 的 `plan / sprint-001 / tasks / review` 骨架。
2. 将 `current-context.md` 切换到新的 active primary stream。
3. 将已完成的 `project-019 / sprint-002` 迁入 completed history，并同步 project index/master plan。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始创建 `project-020` skeleton 并切换 active execution surface。
3. 2026-03-26：已完成 active execution surface 切换、project/sprint 骨架与 `DA-222`。
