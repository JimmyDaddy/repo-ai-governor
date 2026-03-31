# TK-461 integrate assistant markdown rendering and transcript presentation verification

- Status: planned
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-005-session-shell-output-presentation-and-markdown-productization`

## 1. 任务目标

为 assistant 完成态消息接入 markdown rendering，并补齐 transcript presentation 的 contract / regression verification。

## 2. Depends On

1. `TK-460`

## 3. 预期产物

1. assistant markdown renderer baseline
2. transcript presentation verification
3. stderr-only / stdout contract safety evidence

## 4. 验证

1. `pnpm run build`
2. targeted Vitest for session-shell presentation and output contract
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
