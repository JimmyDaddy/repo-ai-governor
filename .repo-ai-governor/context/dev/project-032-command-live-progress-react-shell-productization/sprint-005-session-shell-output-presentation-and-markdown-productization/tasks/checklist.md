# checklist

- [ ] TK-460 implement structured transcript render-kind and session-shell message renderer split
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是把 transcript item 从纯 `lines[]` 升级为 render-kind 驱动的 presenter model，并拆分 message renderer。
- [ ] TK-461 integrate assistant markdown rendering and transcript presentation verification
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是接入 assistant markdown rendering、完成 transcript presentation verification，并确认不破坏 `stderr-only` / `stdout` contract。
