# sprint-002-action-driven-runner-and-palette-state 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-031-session-shell-ink-input-productization`
- Sprint Goal: 将 session shell 收口为 action-driven runner，并完成 composer / palette / handoff preview 的统一状态机。

## 1. Task Package

1. `TK-433` refactor session-shell runner to consume action-driven input stream
2. `TK-434` unify composer palette and handoff preview state under controller actions
3. `TK-435` demote readline adapter to fallback seam and harden lifecycle cleanup

## 2. Exit Criteria

1. `CliSessionShellRunner` 已优先消费 Ink action stream，而不是阻塞式 `readLine()`。
2. composer / palette / preview / prompt-bar 的 presenter-local 状态在 live 输入路径上保持同步。
3. `readline` 只保留 fallback / multiline seam，不再承载默认 foreground input ownership。

## 3. Milestones

1. 2026-03-30：完成 `runWithInkInput()` action loop、`submitComposerValue()` bridge 与 fallback seam demotion。
2. 2026-03-30：完成 prompt-bar live sync、palette guard 与 SIGINT / EOF cleanup 收口。
