# TK-404 stderr-only fallback regression and exit semantics

- Status: planned
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-001-entrypoint-session-shell-foundation`

## 1. 任务目标

回归验证 `stderr-only` / fallback / non-interactive contract，并固定 `/exit`、`Ctrl+C`、`Ctrl+D` 的退出语义。

## 2. Depends On

1. `TK-401`
2. `TK-402`
3. `TK-403`

## 3. 预期产物

1. 非交互场景回退策略
2. 退出语义测试基线
3. regression checklist

## 4. 实施计划

1. 固定 live UI 只能落到 `stderr`。
2. 明确 session exit 不等于 transcript deletion。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
