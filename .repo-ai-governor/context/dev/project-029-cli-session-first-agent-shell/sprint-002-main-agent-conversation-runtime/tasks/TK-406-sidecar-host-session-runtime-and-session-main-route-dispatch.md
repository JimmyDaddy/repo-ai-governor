# TK-406 sidecar host session runtime and session.main route dispatch

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-002-main-agent-conversation-runtime`

## 1. 任务目标

实现 sidecar host session runtime 与 `session.main` route dispatch 基线。

## 2. Depends On

1. `TK-405`

## 3. 预期产物

1. service-backed session runtime
2. `session.main` route dispatch seam
3. main-agent response envelope

## 4. 实施计划

1. 通过 local orchestration service 托管 canonical session state。
2. 保持 `planner / coder / reviewer` 等既有角色不被强行复用为前台主 agent。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
