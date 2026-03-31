# TK-471 harden conversational routing and direct-answer chatability

- Status: planned
- Date: 2026-04-01
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-005-conversational-chat-and-skill-handoff-productization`

## 1. 任务目标

让 `session.main` 的 conversation classification 从“短输入 heuristic 兜底”走向更稳定的 greeting / social chat / repo question / follow-up continuation 分层，并让真实 direct answer 能运行在 tool-capable surface 上而不再被 no-tool bootstrap guard 卡死。

## 2. Depends On

1. `TK-468`

## 3. 预期产物

1. 明确的 conversation classification / follow-up whitelist contract
2. tool-capable surface 上的 direct-answer chatability baseline
3. greeting、repo question、follow-up continuation 的 regression coverage
4. CLI/resume 对 answer-mode turn 的一致消费证据

## 4. 验证

1. `pnpm run build`
2. conversation routing / direct-answer 相关 regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-04-01：任务创建，状态初始化为 `planned`；优先收敛 conversation routing 与 tool-capable direct-answer seam，避免后续 skill routing 建在不稳定的入口判定上。
