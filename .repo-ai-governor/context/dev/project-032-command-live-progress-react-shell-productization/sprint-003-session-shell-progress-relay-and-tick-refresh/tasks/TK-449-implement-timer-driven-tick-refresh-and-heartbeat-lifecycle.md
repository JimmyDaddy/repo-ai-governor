# TK-449 implement timer-driven tick refresh and heartbeat lifecycle

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-003-session-shell-progress-relay-and-tick-refresh`

## 1. 任务目标

为 running handoff 增加 `1s` tick refresh 与 heartbeat lifecycle，确保长命令在无额外键盘输入时也能持续刷新 elapsed / running state。

## 2. Depends On

1. `TK-448`

## 3. 预期产物

1. session shell running tick lifecycle
2. elapsed / heartbeat refresh seam
3. no-input refresh regression tests

## 4. 验证

1. `pnpm run build`
2. targeted Vitest covering timer-driven refresh
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：为 shared `ReactCliCommandProgressController` 新增 `refresh()` seam 与 `heartbeatLabel`，并在 `CliSessionShellCommandProgressDock` 中引入 `1s` timer lifecycle，确保长命令期间 elapsed / heartbeat 可独立于 transport event 持续刷新。
3. 2026-03-31：扩展 `CliCommandProgressPanelViewModel` 与 `ReactCliCommandProgressPanel`，将 heartbeat summary 正式渲染到 running progress dock；running state 结束后会自动停止 tick，避免命令完成后继续无意义重绘。
4. 2026-03-31：补齐 `react-cli-command-progress-controller.test.ts`、`session-shell-command-progress-dock.test.ts` 与 session-shell targeted regression coverage，验证无新 progress event 时仍会每秒刷新 elapsed / heartbeat；同窗口 `pnpm run build` 通过。
