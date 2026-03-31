# TK-447 formalize single-renderer ownership and nested command progress relay

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-003-session-shell-progress-relay-and-tick-refresh`

## 1. 任务目标

让 session shell 成为 nested command handoff 的唯一前台 renderer owner，并为 `runCli(...)` / nested command executor 补齐可选 progress relay seam。

## 2. Depends On

1. `TK-446`

## 3. 预期产物

1. session-shell nested command executor options 扩展，支持 progress relay
2. `main.ts` / nested `runCli(...)` 路径的 renderer ownership 收敛
3. relay 存在时抑制 inner live presenter 的 contract 与测试

## 4. 验证

1. `pnpm run build`
2. targeted Vitest covering nested command relay path
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：扩展 `CliSessionShellCommandExecutor` / nested command executor contract，允许 session shell 在 handoff 执行时透传 `progressSink` / `AbortSignal` 等 execution options，并在 `CliSessionShellRunner` 中正式转发到 pending command executor。
3. 2026-03-31：调整 `CliSessionShellEntrypointRuntime.createNestedCommandExecutor(...)` 与 `main.ts`；re-entered `runCli(...)` 现在会继续携带 nested progress relay，且在 relay 存在时不再要求 inner React live presenter 才能把 progress event 传进命令运行时。
4. 2026-03-31：补齐 targeted Vitest 与 integration coverage，锁定 nested relay forwarding、session-shell executor options forwarding，以及 `json + no-interactive` nested path 的 progress event 不中断回传；同窗口 `pnpm run build` 通过。
