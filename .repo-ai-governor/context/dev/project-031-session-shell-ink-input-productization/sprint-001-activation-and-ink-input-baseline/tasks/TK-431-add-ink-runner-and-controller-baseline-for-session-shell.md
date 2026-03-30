# TK-431 add Ink runner and controller baseline for session shell

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-031-session-shell-ink-input-productization`
- Sprint: `sprint-001-activation-and-ink-input-baseline`

## 1. 目标

为 session shell 引入默认前台输入 ownership 所需的 `InkRunner + InkController` 基线，实现从 frame 外 `readline` 向 Ink-owned input 的第一阶段迁移。

## 2. Acceptance

1. 新增 Ink runner/controller skeleton，并与现有 session-shell runner 保持清晰职责边界。
2. 不破坏 local orchestration service 继续持有 canonical session truth 的约束。
3. `readline` 在本阶段仍可保留为 fallback seam。

## 3. Execution Notes

1. 2026-03-30：开始实现 `CliSessionShellInkController`，将 foreground input action vocabulary 收口为显式 contract。
2. 2026-03-30：同步扩展 `CliSessionShellViewModel`，增加 foreground input owner / focus / action contract 字段，为后续默认 cutover 提供 typed seam。
3. 2026-03-30：完成 palette interactive guard，避免非 slash 态误触发 `Tab / Up / Down`；targeted Vitest 与 `pnpm run build` 通过。
