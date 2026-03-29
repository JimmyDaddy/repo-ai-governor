# TK-401 no-subcommand entry routing and session-shell runner baseline

- Status: planned
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
