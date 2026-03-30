# TK-407 cli-session-client transcript store and resume entrypoints

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-002-main-agent-conversation-runtime`

## 1. 任务目标

实现 CLI session client transcript store，以及会话内 `/resume` 与会话外 `resume` 入口。

## 2. Depends On

1. `TK-405`
2. `TK-406`

## 3. 预期产物

1. `repo-ai-governor resume [session-id]`
2. `/resume [session-id]`
3. transcript store / resume selector

## 4. 实施计划

1. 统一会话内外恢复语义。
2. 不引入顶层 `exit` 子命令。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：`sprint-002` 已激活，开始实现 service-backed transcript store、`/resume` 与顶层 `resume` 入口。
3. 2026-03-30：已完成 CLI session service client、service-backed transcript store、top-level `resume [session-id]`、会话内 `/resume [session-id]`、resume selector 回退与 quoted startup prompt 的会话附着入口。
