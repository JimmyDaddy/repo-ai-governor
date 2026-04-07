# DA-653 sprint-001 closeout and project-final closeout activation handoff

- Status: completed
- Date: 2026-04-07
- Project: `project-058-cli-session-continuity-and-claude-recovery`
- Sprint: `sprint-001-continuity-fallback-and-real-probe-recovery`
- Task: `TK-653`

## 1. Summary

1. `sprint-001-continuity-fallback-and-real-probe-recovery` 已完成 sprint-level closeout。
2. 当前 project/sprint 已具备进入最终 closeout 的全部证据，不需要再追加新的 CR lifecycle。
3. 当前 sprint surface 继续作为 `project-058` final closeout 的默认 `tasks/` / `review/` 面，下一边界固定为 `TK-654`。

## 2. Closed Evidence

1. `TK-652` 已为 `session.main` 注入 `previewSummary / latestNoteSummary` 轻量连续性备注，使 provider backend continuation `unsupported` 时仍能保留最小上下文连续性。
2. `TK-652` 已修复 `Claude Code` real-path CLI 参数拼装回归，在 `--add-dir <directories...>` 与 prompt 之间补入 `--`，避免 prompt 被误判为额外目录。
3. `TK-652` 已记录 targeted regression、same-window `pnpm run build` 与 compiled real probe evidence；本机 `Claude Code` adapter probe 已恢复为 `availabilityStatus=available`。

## 3. Project-Final Activation Result

1. `project-058` plan 继续保留当前 closeout surface，并新增 `TK-654` 作为 project-final closeout 边界。
2. `sprint-001` plan 在 `TK-654` 完成前继续复用同一任务台账 surface；最终完成后将恢复为 `completed` 真值。
3. 本项目没有待开启的 fresh reviewer / scoped CR loop，project-final closeout 只需完成 audit summary、stream clearance 与 history write-back。

## 4. Verification Note

1. 本 handoff 复用 `TK-652` 的同窗口代码验证证据：`pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、compiled `Claude Code` adapter probe `availabilityStatus=available`。
2. `TK-654` final closeout 阶段将补跑 governance closeout checks，并把 `current-context.md` / `completed-streams-history.md` 同步到最终完成态。
