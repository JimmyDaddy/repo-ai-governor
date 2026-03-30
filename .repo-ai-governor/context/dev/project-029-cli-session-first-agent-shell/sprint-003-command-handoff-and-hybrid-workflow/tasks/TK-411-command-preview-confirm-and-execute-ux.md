# TK-411 command preview confirm and execute UX

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-003-command-handoff-and-hybrid-workflow`

## 1. 任务目标

为高副作用 slash command 建立 preview / confirm / execute 的统一 UX。

## 2. Depends On

1. `TK-409`
2. `TK-410`

## 3. 预期产物

1. command preview panel
2. confirmation gate
3. execute / cancel state flow

## 4. 实施计划

1. 先展示规范化命令，再允许用户确认执行。
2. 保持 preview 和 result summary 在 transcript 中可追溯。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已完成 preview / confirm / cancel / execute UX；高副作用 handoff 先展示规范化命令，再由 `/confirm` 或 `/cancel` 驱动执行状态流。
