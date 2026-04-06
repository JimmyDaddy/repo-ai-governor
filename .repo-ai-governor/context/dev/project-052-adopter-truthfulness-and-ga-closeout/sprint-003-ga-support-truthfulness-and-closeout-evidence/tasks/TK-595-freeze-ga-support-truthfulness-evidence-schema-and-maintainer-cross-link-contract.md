# TK-595 freeze GA support truthfulness evidence schema and maintainer cross-link contract

- Status: in_progress
- Date: 2026-04-06
- Task ID: `TK-595`
- Owner: `AI-Agent`
- Priority: `P0`
- Sprint: `sprint-003-ga-support-truthfulness-and-closeout-evidence`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. 任务目标

冻结 GA support truthfulness evidence schema 与 maintainer cross-link contract，明确 support matrix、maintainer evidence、release / clean-room 证据之间的 cross-link 字段和 closeout 判定口径，为后续 unified truth surface 提供稳定输入。

## 2. Depends On

1. `TK-594`

## 3. 预期产物

1. GA support truthfulness evidence schema 说明
2. maintainer cross-link contract 说明
3. `DA-595` handoff artifact 或等价 task output
4. 已同步的 sprint ledger 记录

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-003-ga-support-truthfulness-and-closeout-evidence/plan.md`
4. `docs/support-matrix.md`
5. `docs/support-matrix.zh-CN.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/TK-594-close-adopter-facing-upgrade-and-workspace-ux-with-troubleshooting-acceptance.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/DA-594-upgrade-and-workspace-ux-troubleshooting-and-acceptance-closeout.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/TK-637-sprint-002-exit-acceptance-and-sprint-003-activation-handoff.md`
4. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/DA-637-sprint-002-closeout-and-sprint-003-activation-handoff.md`

## 6. 实施计划

1. 盘点现有 support matrix、README、playbook 与 release/clean-room evidence 的 truth surface。
2. 定义统一 evidence schema 与 maintainer cross-link contract，并写入 task artifact / docs。
3. 更新 task card 与 ledger，作为 `TK-596` 的冻结输入。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`，等待 `sprint-002` 收口。
2. 2026-04-06：`TK-637 / DA-637` 已完成 sprint-002 closeout 与 sprint-003 activation handoff，任务切换为 `in_progress`。

## 10. 产出

1. 待执行：GA support truthfulness evidence schema
2. 待执行：maintainer cross-link contract
