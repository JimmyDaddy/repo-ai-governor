# TK-403 slash command registry and suggestion filter

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-001-entrypoint-session-shell-foundation`

## 1. 任务目标

建立 slash command metadata registry 与前缀过滤推荐器。

## 2. Depends On

1. `TK-401`
2. `TK-402`

## 3. 预期产物

1. `SessionSlashCommandRegistry`
2. `slash-command-palette.tsx`
3. 前缀过滤与高亮策略

## 4. 实施计划

1. 先覆盖 MVP 命令集合，不提前暴露 deferred commands。
2. 保持 metadata 后续可复用到 desktop command palette。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
