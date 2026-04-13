# checklist

- [x] TK-815 clarify theme persistence target feedback for set-ui-theme
  - 2026-04-13：任务创建并直接进入 `in_progress`，范围锁定为 theme persistence 成功反馈澄清，不改变持久化语义本身。
  - 2026-04-13：已为 workspace/global scope 引入更明确的持久化目标描述，并区分 `workspace config`、`global user-config` 与“active workspace config + repo-local selector config”双写场景。
  - 2026-04-13：已同步中英文 i18n、workspace summary/help/status/message 与相关回归断言。
  - 2026-04-13：已执行聚焦 vitest 回归集与 `pnpm run build`，验证通过。
- [x] TK-816 finalize project-095 closeout after persistence feedback clarification
  - 2026-04-13：任务创建，状态初始化为 `planned`；待 `TK-815` 完成并验证通过后执行最终 closeout。
  - 2026-04-13：`TK-815` 已完成反馈澄清、聚焦 vitest 与 `pnpm run build` 验证。
  - 2026-04-13：已创建 project-level completion audit summary，切回 project/sprint `completed` 真值，并把 `stream-project-095-sprint-001` 从 `current-context.md` active surface 迁入 completed history。
  - 2026-04-13：已执行最终 ledger/status gate 核验，确认 closeout 后的 sqlite/checklist/tasks.csv、review lifecycle 与 idle context 同步无漂移。
