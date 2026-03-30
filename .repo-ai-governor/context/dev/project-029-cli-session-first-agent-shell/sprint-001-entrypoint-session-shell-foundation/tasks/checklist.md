# checklist

- [x] TK-401 no-subcommand entry routing and session-shell runner baseline
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：激活 `project-029 / sprint-001`，将 primary stream 从 `project-027 / sprint-003` closeout surface 切换到 session-first shell foundation，并补充 `DA-401` 激活交接记录。
  - 2026-03-30：实现完成，已落地 `main.ts` 无子命令默认入口分流、`CliSessionShellRunner`、readline prompt adapter 与 stderr-only renderer；`--help`、显式子命令、`--no-interactive`、非 TTY 与 `json/plain` 仍保持旧语义。
- [x] TK-402 transcript / composer / prompt-bar React components
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：实现完成，已新增 `session-shell-app.tsx`、`transcript-pane.tsx`、`composer-input.tsx`、`prompt-bar.tsx`，并通过 `ReactCliRunner.renderSessionShellFrame()` 接入共享 Ink 渲染底座。
- [x] TK-403 slash command registry and suggestion filter
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：实现完成，已新增 `CliSessionSlashCommandRegistry`、前缀过滤/高亮策略、`slash-command-palette.tsx` 以及 `/help /exit /init /connect /doctor /workspace /workflow` 的 MVP metadata 集合。
- [x] TK-404 stderr-only / fallback / non-interactive regression and exit semantics
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：实现完成，已固定 live UI 只渲染到 `stderr`，并通过 runner/unit/integration tests 锁定 `/exit`、`Ctrl+C`、`Ctrl+D` 与 no-subcommand fallback contract。
  - 2026-03-30：验证通过：`pnpm run typecheck`、`pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts`、`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts`。
