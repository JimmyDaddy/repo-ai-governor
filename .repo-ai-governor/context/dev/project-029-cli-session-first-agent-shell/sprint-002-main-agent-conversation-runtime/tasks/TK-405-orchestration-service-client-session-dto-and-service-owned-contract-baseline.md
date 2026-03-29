# TK-405 orchestration-service-client session DTO and service-owned contract baseline

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-002-main-agent-conversation-runtime`

## 1. 任务目标

定义 service-backed session DTO，并固定 CLI 不是 canonical session owner 的 contract。

## 2. Depends On

1. `TK-404`

## 3. 预期产物

1. `startSession / sendSessionTurn / subscribeSession / getSession / listSessions / resumeSession` DTO baseline
2. service-owned state constraint

## 4. 实施计划

1. 先固定 DTO 和 ownership，再推进 presenter 实现。
2. 保持 future desktop 与 CLI 共享同一份 session DTO。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
