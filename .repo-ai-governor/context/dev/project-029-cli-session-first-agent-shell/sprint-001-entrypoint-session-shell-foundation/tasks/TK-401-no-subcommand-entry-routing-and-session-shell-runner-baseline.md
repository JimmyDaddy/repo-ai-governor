# TK-401 no-subcommand entry routing and session-shell runner baseline

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-001-entrypoint-session-shell-foundation`

## 1. 任务目标

建立 `repo-ai-governor` 无子命令默认进入 session shell 的入口分流与 runner 基线。

## 2. Depends On

1. `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
2. `.repo-ai-governor/draft/review-interactive-cli-session-first-agent-shell-technical-solution.md`

## 3. 预期产物

1. `apps/cli/src/main.ts` entry routing baseline
2. `CliSessionShellRunner` runtime skeleton
3. `DA-401`

## 4. 实施计划

1. 固定无子命令默认进入 session shell 的 gating 条件。
2. 保留 `--help`、显式子命令、非 TTY 与 `json/plain` 的旧语义。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已激活 `project-029 / sprint-001`，并将 `current-context.md` primary stream 切换到 session-first shell foundation；`DA-401` 也已更新为实际 handoff 状态。
3. 2026-03-30：实现完成，已落地 `apps/cli/src/main.ts` 的 no-subcommand 分流、`CliSessionShellRunner`、`CliSessionShellReadlinePromptAdapter` 与 `CliSessionShellStderrRenderer`。
4. 2026-03-30：验证通过：`pnpm run typecheck`、`pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/cli-output-contract.integration.test.ts`。
