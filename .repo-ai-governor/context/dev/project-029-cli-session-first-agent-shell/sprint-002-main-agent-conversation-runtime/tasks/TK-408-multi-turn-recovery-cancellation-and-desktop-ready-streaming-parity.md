# TK-408 multi-turn recovery cancellation and desktop-ready streaming parity

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-002-main-agent-conversation-runtime`

## 1. 任务目标

补齐多轮对话中的错误恢复、取消语义与 desktop-ready streaming parity。

## 2. Depends On

1. `TK-406`
2. `TK-407`

## 3. 预期产物

1. cancellation contract
2. multi-turn recovery semantics
3. desktop-ready streaming parity checklist

## 4. 实施计划

1. 明确错误恢复与取消的 session-level 行为。
2. 避免 CLI 与 desktop 在 streaming 语义上分叉。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
