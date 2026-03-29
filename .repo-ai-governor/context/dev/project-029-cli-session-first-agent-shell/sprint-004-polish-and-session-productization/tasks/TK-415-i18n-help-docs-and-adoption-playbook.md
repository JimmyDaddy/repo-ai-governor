# TK-415 i18n help docs and adoption playbook

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-004-polish-and-session-productization`

## 1. 任务目标

同步 i18n、help、docs 与 adopter-facing playbook，并确保 session-first 全能力面在帮助面上可发现。

## 2. Depends On

1. `TK-413`
2. `TK-414`

## 3. 预期产物

1. help surface updates
2. i18n parity updates
3. adoption playbook
4. `!`、`/theme`、session routing setting command、`repo-ai-governor "query"` 的可发现性收口

## 4. 实施计划

1. 确保用户可发现 session-first 入口、resume 能力、slash palette 以及 sprint-004 新并入的全部 CLI 能力。
2. 保持中英文文案与 shared i18n runtime 一致。

## 5. 验证

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
