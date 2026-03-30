# TK-404 stderr-only / fallback / non-interactive regression and exit semantics

- Status: completed
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
2. 2026-03-30：实现完成，已将 session shell live UI 固定为 `stderr-only`，并通过 no-subcommand route 把 `stdout` 保留给帮助面或未来机器输出契约。
3. 2026-03-30：已用 runner/unit/integration tests 固定 `/exit`、`Ctrl+C`、`Ctrl+D` 的退出语义，并明确 session exit 不等于 transcript deletion。
4. 2026-03-30：验证通过：`pnpm run typecheck`、`pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts`、`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts`。
