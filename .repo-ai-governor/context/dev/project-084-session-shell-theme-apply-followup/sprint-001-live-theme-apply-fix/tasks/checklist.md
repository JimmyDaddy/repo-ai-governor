# checklist

- [x] TK-771 fix session-shell live theme apply after workspace set-ui-theme succeeds
  - 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为 session shell live theme apply 修复与回归测试补齐。
  - 2026-04-11：确认根因是 direct command 成功后前台 session shell 没有把 `set-ui-theme` 的目标 preset 回写到当前 `viewModel.themePreset`。
  - 2026-04-11：完成 runtime 修复，在 direct `workspace set-ui-theme` 成功后即时同步当前前台 shell 的 theme preset。
  - 2026-04-11：补充 runner 回归测试，验证 `/workspace set-ui-theme calm` 后同一 shell 生命周期内的 `/status` 已显示 `theme=calm`。
  - 2026-04-11：执行指定 vitest 回归集与 `pnpm run build`，验证通过。
- [x] TK-772 finalize project-084 closeout after live theme apply fix
  - 2026-04-11：任务创建，状态初始化为 `planned`。
  - 2026-04-11：`TK-771` 已完成并通过 targeted vitest + `pnpm run build` 验证。
  - 2026-04-11：已创建 project-level completion audit summary，切回 project/sprint `completed` 真值，并把 `project-084 / sprint-001` 从 `current-context.md` active primary stream 迁入 completed history。
  - 2026-04-11：已执行最终 ledger/status gate 核验，确认 closeout 后的 sqlite/checklist/tasks.csv、review lifecycle 与 idle context 同步无漂移。
