# TK-414 multiline history and search UX

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-004-polish-and-session-productization`

## 1. 任务目标

补齐 multiline、history、search 等持续会话 UX，并在同一 sprint 内实现 `!` shell passthrough 与 `repo-ai-governor "query"` 初始 prompt 启动入口。

## 2. Depends On

1. `TK-413`

## 3. 预期产物

1. multiline input baseline
2. history navigation
3. search / recall UX
4. `!` shell passthrough
5. `repo-ai-governor "query"` 初始 prompt 启动入口

## 4. 实施计划

1. 把 multiline / history / search 与 passthrough / query startup 一起收口为完整持续会话 UX。
2. 保持输入 UX、slash palette 与 shell passthrough 三者不冲突。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
