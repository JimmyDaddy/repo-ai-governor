# sprint-003-session-shell-progress-relay-and-tick-refresh 计划

- Status: completed
- Date: 2026-03-31
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint Goal: 按方案 C 收口 session-shell nested command live progress，让当前 shell 成为唯一 renderer owner，并补齐 progress relay 与 timer-driven tick refresh。

## 1. Task Package

1. `TK-447` formalize single-renderer ownership and nested command progress relay
2. `TK-448` add session-shell running progress dock and shared controller reuse
3. `TK-449` implement timer-driven tick refresh and heartbeat lifecycle
4. `TK-450` roll out connect doctor verify session-shell live progress and regression coverage

## 2. Exit Criteria

1. session shell 在 nested command handoff 期间成为唯一前台 renderer owner。
2. nested `runCli(...)` 能把 `CliCommandProgressEvent` relay 回 session shell，并在 relay 存在时抑制 inner live presenter。
3. session shell 具备正式的 `commandProgressPanel` running dock，能够复用 shared progress controller。
4. running 状态下无需额外键盘输入，也能每秒刷新 elapsed / heartbeat。
5. `connect / doctor / verify` 在 session shell 中显示 live progress，并有回归测试覆盖。
6. `stderr-only` live contract 与最终 `stdout` machine-readable payload 保持兼容。

## 3. Milestones

1. 2026-03-31：基于 session-first shell draft 的方案 C 对比结论，创建 `sprint-003` planning surface。
2. 2026-03-31：将 `TK-447 ~ TK-450` 写入 sprint task package，明确先做 renderer ownership，再做 progress dock、tick refresh 与 multi-command rollout。
3. 2026-03-31：完成 `TK-447`，为 session-shell nested handoff 正式补齐 `progress relay` seam，并让 re-entered `runCli(...)` 在 `json + no-interactive` nested path 下也继续转发 progress events。
4. 2026-03-31：完成 `TK-448`，让 session shell 直接持有 `commandProgressPanel`，并复用 shared progress controller 将 bridge progress events 渲染为当前 shell 内的 running dock。
5. 2026-03-31：完成 `TK-449`，为 session-shell running progress dock 增加 `1s` timer-driven tick refresh 与 heartbeat lifecycle，长命令期间无需额外输入也能持续刷新 elapsed / heartbeat。
6. 2026-03-31：完成 `TK-450`，将 `connect / doctor / verify` 统一接入 session-shell live progress consumer path，并补齐命令级、nested `runCli(...)` 与 session-shell targeted regression coverage。
