# checklist

- [x] TK-447 formalize single-renderer ownership and nested command progress relay
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是让 session shell 成为 nested command 唯一 renderer owner，并为 `runCli(...)` 增加 progress relay seam。
  - 2026-03-31：完成 contract baseline；`CliSessionShellRunner` 现在会向 pending command executor 透传 execution options，`CliSessionShellEntrypointRuntime` 会把 nested progress relay 传给 re-entered `runCli(...)`，而 `main.ts` 已改为在 relay 存在时继续向命令运行时传递 progress events，不再依赖 inner React presenter。
  - 2026-03-31：验证通过 `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/cli-output-contract.integration.test.ts` 与 `pnpm run build`。
- [x] TK-448 add session-shell running progress dock and shared controller reuse
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是把 shared progress controller 的产物接到 session-shell layout，形成正式 running dock。
  - 2026-03-31：完成 session-shell running dock；新增 `CliSessionShellCommandProgressDock` 复用 shared `ReactCliCommandProgressController`，并让 `CliSessionShellViewModel` / `ReactCliSessionShellApp` 正式挂载 `commandProgressPanel`。
  - 2026-03-31：验证通过 `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts` 与 `pnpm run build`。
- [x] TK-449 implement timer-driven tick refresh and heartbeat lifecycle
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是为 running handoff 增加 `1s` tick、elapsed refresh 与 heartbeat lifecycle。
  - 2026-03-31：完成 shared progress controller / session-shell progress dock timer seam；新增 `refresh()`、`heartbeatLabel`、`1s` tick lifecycle 与 `CliSessionShellCommandProgressDock.startTicking()`，让长命令在无额外输入时也能持续刷新 elapsed / heartbeat。
  - 2026-03-31：验证通过 `pnpm exec vitest run apps/cli/test/runtime/react-cli-command-progress-controller.test.ts apps/cli/test/runtime/session-shell-command-progress-dock.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts` 与 `pnpm run build`。
- [x] TK-450 roll out connect doctor verify session-shell live progress and regression coverage
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是将 `connect / doctor / verify` 接入 session-shell live progress，并补齐 regression coverage。
  - 2026-03-31：完成 `doctor / verify` progress lifecycle rollout；两条命令现均会发出 running / row / artifact / success-or-failure progress patches，session shell / nested `runCli(...)` / direct command seams 统一消费同一 transport-neutral event contract。
  - 2026-03-31：新增 `doctor-command.test.ts`、`verify-command.test.ts` 与 nested `runCli(...)` integration coverage，验证 `connect / doctor / verify` 在 `json + no-interactive` nested path 下均会继续转发 live progress events；同窗口 `pnpm run build` 通过。
