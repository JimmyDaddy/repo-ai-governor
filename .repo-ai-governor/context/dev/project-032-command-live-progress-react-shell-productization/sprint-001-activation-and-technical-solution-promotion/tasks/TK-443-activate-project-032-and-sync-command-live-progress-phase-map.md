# TK-443 activate project-032 and sync command-live-progress phase map

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-001-activation-and-technical-solution-promotion`

## 1. 任务目标

为 command live progress React shell follow-up 建立正式 project/sprint/task surface，并把 `current-context.md` 切换到新的 active stream，使后续 delivery registry 可以安全指向真实 follow-up records。

## 2. Depends On

1. `.repo-ai-governor/draft/command-live-progress-react-shell-technical-solution.md`

## 3. 预期产物

1. `project-032` project plan
2. `sprint-001` / `sprint-002` planning surface
3. `current-context.md` active + planned follow-up stream sync
4. `completed-streams-history.md` 新增 `project-030 / sprint-004`

## 4. 实施计划

1. 创建 `project-032` 的 project plan、sprint plan、checklist、CSV 与 task cards。
2. 将 `project-030 / sprint-004` 从 `current-context.md` active closeout surface 迁入 completed history。
3. 将 `project-032 / sprint-001` 设为新的 primary stream，并把 `sprint-002` 作为 planned follow-up stream 登记。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only，本任务未修改可执行代码，因此 `build not required`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已完成 `project-032` activation、`current-context.md` primary stream 切换与 planned follow-up stream 登记。
3. 2026-03-30：已将 `project-030 / sprint-004` 迁入 completed history，避免继续占用默认 active surface。
