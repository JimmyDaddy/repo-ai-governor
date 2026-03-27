# TK-234 sprint-004 激活与 adopter pilot 仓库冻结

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-004-adopter-pilot-and-documentation-closure`

## 1. 任务目标

激活 `sprint-004`，将 active execution surface 从已完成的 `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline` 切换到 adopter pilot 主线，并冻结本轮试点仓库。

## 2. Depends On

1. `DA-233`
2. `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline` completed

## 3. 预期产物

1. `sprint-004` skeleton。
2. 更新后的 `current-context.md`。
3. 更新后的 `completed-streams-history.md`。
4. `DA-234`

## 4. 实施计划

1. 创建 `sprint-004-adopter-pilot-and-documentation-closure` 的 `plan / tasks / review` 目录。
2. 将 `current-context.md` 切换到新的 active primary stream。
3. 冻结两条 pilot 仓库路径，并将 `sprint-003` 迁入 completed history。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始创建 sprint-004 skeleton、切换 current-context 并冻结 pilot 仓库。
3. 2026-03-27：已完成 sprint-004 skeleton、pilot 仓库冻结、current-context 切换、completed history 迁移与 `DA-234`。
