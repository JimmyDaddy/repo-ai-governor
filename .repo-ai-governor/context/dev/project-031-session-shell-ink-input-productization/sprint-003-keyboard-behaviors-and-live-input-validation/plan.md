# sprint-003-keyboard-behaviors-and-live-input-validation 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-031-session-shell-ink-input-productization`
- Sprint Goal: 收口 palette keyboard 行为、live input 边界条件与 Ink 测试 seam。

## 1. Task Package

1. `TK-436` implement palette keyboard navigation completion and clear-screen semantics
2. `TK-437` add Ink live-input tests for paste long-input and CJK scenarios
3. `TK-438` lock stderr-only fallback and output-contract regressions for live session shell

## 2. Exit Criteria

1. `Up/Down`、`Tab`、`Esc`、`Ctrl+L` 等键盘语义在 Ink path 中稳定可用。
2. paste / long input / CJK / Unicode backspace 行为具备正式测试覆盖。
3. `stderr-only`、default session-shell entry 与 output contract regression 已通过验证。

## 3. Milestones

1. 2026-03-30：新增纯函数 keypress mapper，完成 keyboard semantics 收口。
2. 2026-03-30：完成 paste / long input / CJK / Unicode backspace tests，并通过 clean temp repo TTY smoke。
