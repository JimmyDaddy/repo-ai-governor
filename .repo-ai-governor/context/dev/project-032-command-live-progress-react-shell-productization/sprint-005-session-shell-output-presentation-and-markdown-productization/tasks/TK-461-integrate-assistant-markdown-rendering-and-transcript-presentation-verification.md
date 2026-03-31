# TK-461 integrate assistant markdown rendering and transcript presentation verification

- Status: completed
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

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：为 assistant 完成态消息接入轻量 Markdown block renderer，支持 heading / paragraph / list / quote / fenced code 基础呈现，同时明确 live running dock 不进入 markdown renderer。
3. 2026-03-31：补齐 transcript store、React CLI runner、session-shell runner 与 output contract regression coverage，验证 render-kind / markdown rollout 不破坏现有 `stderr-only` live UI 与最终 `stdout` machine-readable contract。
4. 2026-03-31：新增 `resolved_code_review_tk-460-tk-461-session-shell-transcript-markdown-rollout.md` 与 `DA-461-session-shell-output-presentation-and-markdown-rollout-closeout.md`，并通过 targeted Vitest、`pnpm run build`、task/sprint/code-review sync 与 technical-solution delivery/lifecycle checks。
5. 2026-03-31：working-tree CR 修复后重新通过 transcript/store、session-shell runner、output contract 与 `pnpm run build` 验证，确认 recap/backlink presenter 修正没有破坏 markdown path 或 `stderr-only` / `stdout` contract。
