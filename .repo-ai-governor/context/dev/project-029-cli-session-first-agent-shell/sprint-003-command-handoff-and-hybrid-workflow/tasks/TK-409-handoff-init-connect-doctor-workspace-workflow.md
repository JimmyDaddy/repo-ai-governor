# TK-409 handoff init connect doctor workspace workflow

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-003-command-handoff-and-hybrid-workflow`

## 1. 任务目标

将 `/init / connect / doctor / workspace / workflow` 接到现有 command runtime。

## 2. Depends On

1. `TK-408`

## 3. 预期产物

1. `cli_handoff` command bridge
2. normalized command preview
3. safe handoff summary

## 4. 实施计划

1. 优先接入低到中副作用的 CLI handoff 集合。
2. 保持现有子命令 contract 零回归。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已完成 `/init / connect / doctor / workspace / workflow` 的 slash handoff bridge，session shell 现在可在 transcript 中预览并执行这些命令。
