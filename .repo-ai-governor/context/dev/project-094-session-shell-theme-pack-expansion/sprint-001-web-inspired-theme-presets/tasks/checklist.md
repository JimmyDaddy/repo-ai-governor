# checklist

- [x] TK-813 expand session-shell theme presets with web-inspired palettes
  - 2026-04-13：任务创建并直接进入 `in_progress`，范围锁定为 session shell 现有 theme preset system 的增量扩展。
  - 2026-04-13：已确认当前公开真值仍只有 `governor / catppuccin / calm`，需要同步更新 shared preset enum、theme registry、selector、slash discoverability、help 文本与 docs。
  - 2026-04-13：参考 Tokyo Night、Kanagawa 与 Flexoki 官方 palette 资料，确定新增 `tokyo-night`、`kanagawa`、`flexoki` 三组差异化 preset，并明确不重复引入与既有 `governor` 近似的 Nord 风格。
  - 2026-04-13：已将具体主题定义从 `react-cli-theme-registry.ts` 抽离到 `react-cli-theme-presets.ts` 与 `react-cli-theme-factory.ts`，使 registry 仅负责 preset resolution。
  - 2026-04-13：已同步 shared constants、CLI validation、i18n、README/CLI README、formal session-shell docs 与 slash discoverability。
  - 2026-04-13：已执行 6-file vitest 回归集与 `pnpm run build`，验证通过。
- [x] TK-814 finalize project-094 closeout after theme pack expansion
  - 2026-04-13：任务创建，状态初始化为 `planned`；待 `TK-813` 完成并验证通过后执行最终 closeout。
  - 2026-04-13：`TK-813` 已完成新增 preset、preset catalog 拆分、聚焦 vitest 与 `pnpm run build` 验证。
  - 2026-04-13：已创建 project-level completion audit summary，切回 project/sprint `completed` 真值，并把 `stream-project-094-sprint-001` 从 `current-context.md` active surface 迁入 completed history。
  - 2026-04-13：已执行最终 ledger/status gate 核验，确认 closeout 后的 sqlite/checklist/tasks.csv、review lifecycle 与 idle context 同步无漂移。
