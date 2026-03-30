# checklist

- [x] TK-430 activate project-031 and sync Ink-input phase map
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：`current-context.md` primary stream 已切换到 `project-031 / sprint-001`，`project-030 / sprint-003` 已迁入 completed history。
- [x] TK-431 add Ink runner and controller baseline for session shell
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：开始实现 `CliSessionShellInkController` baseline，并把 session-shell contract 扩展到 foreground input owner / focus / action contract。
  - 2026-03-30：已完成 `CliSessionShellInkController`、foreground input contract typed seam 与 palette guard；`pnpm run build`、targeted Vitest 通过。
- [x] TK-432 mount session-shell app as live Ink tree and preserve stderr-only contract
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：开始实现 `CliSessionShellInkRunner` 与 `ReactCliRunner.mountSessionShell()` live mount seam，验证继续走 `stderr`。
  - 2026-03-30：已完成 live Ink tree mount/rerender seam、action queue 与 `stderr-only` 保持；targeted Vitest 与 clean temp repo TTY smoke 通过。
