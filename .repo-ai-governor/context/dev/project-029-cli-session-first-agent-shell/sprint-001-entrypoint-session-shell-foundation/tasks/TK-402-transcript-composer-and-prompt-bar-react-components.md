# TK-402 transcript composer and prompt-bar React components

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-001-entrypoint-session-shell-foundation`

## 1. 任务目标

实现 transcript、composer 与 prompt-bar 的最小 React 组件骨架。

## 2. Depends On

1. `TK-401`

## 3. 预期产物

1. `session-shell-app.tsx`
2. `transcript-pane.tsx`
3. `composer-input.tsx`
4. `prompt-bar.tsx`

## 4. 实施计划

1. 定义 transcript / composer / prompt-bar 的最小 presenter 语义。
2. 保持组件层不拥有 canonical session truth。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
