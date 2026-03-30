# TK-432 mount session-shell app as live Ink tree and preserve stderr-only contract

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-031-session-shell-ink-input-productization`
- Sprint: `sprint-001-activation-and-ink-input-baseline`

## 1. 目标

把 session-shell app 从静态 frame 渲染演进为 live Ink tree 挂载，同时锁定 `stderr-only` 输出边界，确保后续 live input 能在正确的 ownership 层落地。

## 2. Acceptance

1. session-shell app 已能通过 live Ink tree 挂载。
2. `stdout` 不得被 live UI 污染，`stderr-only` contract 保持成立。
3. 为 sprint-002 的 action-driven runner 改造保留明确接缝。

## 3. Execution Notes

1. 2026-03-30：开始实现 `CliSessionShellInkRunner`，将 live Ink mount/rerender lifecycle 固定到 `stderr`。
2. 2026-03-30：同步扩展 `ReactCliRunner`，增加 `mountSessionShell()` / `rerenderSessionShell()` seam，供后续 session-shell default cutover 复用。
3. 2026-03-30：完成 action queue + interrupt/EOF lifecycle，并在 clean temp repo TTY smoke 中验证 `/` 即时打开 palette 与 `stderr-only` 行为。
