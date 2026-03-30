# checklist

- [x] TK-436 implement palette keyboard navigation completion and clear-screen semantics
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：已完成 `mapSessionShellKeypressToAction()`，收口 `Up/Down`、`Tab`、`Esc`、`Enter`、`Ctrl+L`、`Ctrl+C`、`Ctrl+D`。
- [x] TK-437 add Ink live-input tests for paste long-input and CJK scenarios
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：已完成 long paste、CJK 输入、Unicode backspace 与 palette completion 单测。
- [x] TK-438 lock stderr-only fallback and output-contract regressions for live session shell
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：已通过 `cli-output-contract.integration`、`pnpm run build` 与 clean temp repo TTY smoke，确认 `/` 即时出现 palette、`Tab` 补全、`stderr-only` 与 default entry contract。
