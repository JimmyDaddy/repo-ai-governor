# TK-413 session settings commands

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-004-polish-and-session-productization`

## 1. 任务目标

为 session-first shell 收口主题、memory、routing 等 settings command 命令面，并完成 deferred command naming 的正式决策。

## 2. Depends On

1. `TK-412`

## 3. 预期产物

1. session settings command set
2. settings visibility rules
3. `/theme`
4. session routing setting command 的正式命名与实现落点

## 4. 实施计划

1. sprint-004 内收口真正需要的 settings command，而不是继续后置。
2. `/model` 若不再沿用，需在本任务内最终收口为 `/agent` 或 `/routing` 之一，并同步文档与帮助面。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
