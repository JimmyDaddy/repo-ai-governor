# checklist

- [x] TK-462 render seeded running progress before direct bridge command execution blocks
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是修复 session shell direct bridge 命令的 first-frame progress visibility。
  - 2026-03-31：已完成 `seedRunningState()` 后的立即 render 修复，并新增 direct bridge seeded progress regression case。
  - 2026-03-31：已通过 `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts` 与 `pnpm run build` 验证。
