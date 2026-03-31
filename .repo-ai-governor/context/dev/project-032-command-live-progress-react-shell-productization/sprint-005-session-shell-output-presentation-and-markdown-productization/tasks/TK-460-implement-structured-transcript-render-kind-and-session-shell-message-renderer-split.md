# TK-460 implement structured transcript render-kind and session-shell message renderer split

- Status: planned
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-005-session-shell-output-presentation-and-markdown-productization`

## 1. 任务目标

将 session-shell transcript item 从单一 `label + lines[]` 模型升级为 render-kind 驱动的 presenter model，并拆分 transcript pane 的消息 renderer。

## 2. Depends On

1. `TK-459`

## 3. 预期产物

1. transcript render-kind contract baseline
2. session-shell message renderer split
3. command recap / system notice presenter baseline

## 4. 验证

1. targeted Vitest for session-shell transcript renderer
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
