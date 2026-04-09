# DA-654 project-058 final closeout and active stream clearance

- Status: completed
- Date: 2026-04-07
- Project: `project-058-cli-session-continuity-and-claude-recovery`
- Sprint: `sprint-001-continuity-fallback-and-real-probe-recovery`
- Task: `TK-654`

## 1. Summary

1. `project-058-cli-session-continuity-and-claude-recovery` 已完成最终 closeout。
2. 本轮用户反馈的两个 CLI 问题都已用实现、测试、build 与真实本机 probe evidence 收口。
3. 当前 worktree 已不再保留 active primary stream，`project-058 / sprint-001` 已移入 completed history。

## 2. Closed Evidence

1. `TK-652`：`session.main` 在 provider backend continuation `unsupported` 时，现会回退到 lightweight session note continuity，而不是直接失去会话连续性。
2. `TK-652`：`Claude Code` real-path CLI 参数拼装回归已修复，prompt 不再被 `--add-dir <directories...>` 吞掉。
3. `TK-653`：sprint-level closeout 已确认本项目无需追加新的 CR lifecycle，可直接进入 final closeout。

## 3. Final Closeout Result

1. `project-058` plan 已恢复为最终 `completed` 真值，并追加 completion audit summary milestone backlink。
2. `sprint-001` plan 已恢复为最终 `completed` 真值。
3. `current-context.md` 已清空 `Active Streams`，`completed-streams-history.md` 已登记 `stream-project-058-sprint-001`。

## 4. Verification Note

1. project-final closeout 复用同窗口代码验证证据：`pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、compiled `Claude Code` adapter probe `availabilityStatus=available`。
2. closeout 阶段补跑治理同步检查：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`。
