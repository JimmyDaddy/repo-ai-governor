# TK-452 formalize session.main contract delta and structured turn semantics

- Status: planned
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-033-session-main-agent-runtime-productization`
- Sprint: `sprint-001-activation-and-session-main-contract-delta`

## 1. 任务目标

把 `session.main` 从 `baseline_ack` 升级到真实主 agent turn 所需的 contract delta 写清楚，包括 request、event stream、structured result 与 adapter-selection metadata。

## 2. Depends On

1. `TK-451`

## 3. 预期产物

1. `session.main` turn lifecycle contract delta
2. structured result shape for `assistantMessage / suggestedSlashCommand / executionIntent / followUpQuestion`
3. assistant delta / completed / failed / cancelled event semantics
4. adapter selection、routing preference 与 handoff backlink metadata baseline

## 4. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only consistency review against `runtime-cli-interactive-shell` module docs

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
