# checklist

- [x] TK-463 improve session-shell command recap presentation and artifact formatting
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是把 Governor 的 `command_recap` 从文本平铺提升为结构化 recap card。
  - 2026-03-31：已完成 recap card presenter、摘要/关键状态/artifact section 拆分与 backlink 样式优化。
  - 2026-03-31：已通过 `pnpm exec vitest run apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-runner.test.ts` 与 `pnpm run build` 验证。
  - 2026-03-31：补齐 slash handoff recap metadata seam；`SESSION_MESSAGE_APPENDED` 成功消息现可命中 `command_recap` renderer，并已通过 `session-shell-transcript-store` / `session-shell-runner` / `react-cli-runner` 回归与 `pnpm run build` 验证。
