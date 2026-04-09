# checklist

- [x] TK-652 fix session.main continuity fallback and Claude Code real-path CLI regression
  - 2026-04-07：任务创建，状态初始化为 `in_progress`；本轮先修复真实 CLI 回归并补上 continuity fallback。
  - 2026-04-07：定位 `Claude Code` real-path probe 失败根因是 `--add-dir <directories...>` 为可变参数，原实现把 prompt 紧跟在该参数后面，导致 prompt 被误吃成额外目录。
  - 2026-04-07：已在 `packages/adapters/claude-code` 为 CLI prompt 增加 `--` 分隔符，并新增默认 exec-runner regression test，确保 prompt 不再被 `--add-dir` 吞掉。
  - 2026-04-07：已把 `latestNoteSummary / previewSummary` 从 shared session context 注入 `session.main` direct-answer / role-delegate 输入，使 provider continuation `unsupported` 时仍有 lightweight continuity note 可用，同时将 transcript 文案改为显式说明会回退到轻量会话摘要。
  - 2026-04-07：同窗口 `pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build` 全部通过；编译后真实 `Claude Code` adapter probe 已在本机返回 `availabilityStatus=available`，任务完成。
- [x] TK-653 sprint-001 exit acceptance and follow-up handoff readiness
  - 2026-04-07：任务创建，状态初始化为 `planned`；等待 `TK-652` 完成后激活。
  - 2026-04-07：已汇总 `TK-652` 的 closeout 证据，确认两个用户反馈问题都已有实现、回归测试、same-window build 与 compiled real probe 支撑。
  - 2026-04-07：已写入 `DA-653`，并确认 `project-058` 不需要新增 review lifecycle；下一边界固定为 `TK-654` project-final closeout 与 active stream clearance。
- [x] TK-654 finalize project-058 closeout and clear the active primary stream
  - 2026-04-07：任务在 `TK-653` 完成后创建，并在同一窗口进入 project-final closeout。
  - 2026-04-07：已写入 `DA-654` 与 `project-058` completion audit summary，并把 `project-058 / sprint-001` 恢复为最终 `completed` 真值。
  - 2026-04-07：已将当前 primary stream 从 `current-context.md` 移入 `completed-streams-history.md`，当前 worktree 不再保留 active primary stream。
