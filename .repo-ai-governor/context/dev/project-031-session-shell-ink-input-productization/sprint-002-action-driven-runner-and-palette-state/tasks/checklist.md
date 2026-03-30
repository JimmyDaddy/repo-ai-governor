# checklist

- [x] TK-433 refactor session-shell runner to consume action-driven input stream
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：已完成 `runWithInkInput()`、`submitComposerValue()` 与 Ink/default path 切分；`shouldUseInkInput()` 在 TTY + `stderr` TTY 下优先走 Ink。
- [x] TK-434 unify composer palette and handoff preview state under controller actions
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：已完成 composer / palette action contract、palette interactive guard 与 live prompt-bar 同步。
- [x] TK-435 demote readline adapter to fallback seam and harden lifecycle cleanup
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：已完成 readline fallback seam demotion，Ink interrupt / EOF / close cleanup 保持稳定，`/multiline` 继续走 fallback prompt adapter。
