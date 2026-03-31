# checklist

- [x] TK-455 integrate session.main with adapter routing and session-level routing preference
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是让 `session.main` 正式消费 `sessionRoutingPreference`，并输出更可信的 adapter-surface 选择语义。
  - 2026-03-31：已让 dispatcher 根据 session routing preference 选择 surface、更新 handoff preview，并让 transcript presenter 显示 routing selection。
  - 2026-03-31：working-tree CR 复核后补齐回归修复；failed/cancelled turn 不再复用后续 `turnIndex`，并新增 monotonic numbering regression test。
- [x] TK-456 emit command-intent suggestion handoff metadata and transcript backlinks
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是继续把 handoff metadata 推进到 artifact backlinks 与 richer downstream consumer contract。
  - 2026-03-31：已为 `TURN_COMPLETED` payload 新增 `handoffBacklinks` 数组，并让 transcript 渲染 backlink lines，形成可见的 command-intent / preview 回链基线。
  - 2026-03-31：working-tree CR 复核后补齐 transcript fallback 修复；plain completed turn 重新保留兼容式 `mainTurnEcho` recap，并补充 transcript-store regression coverage。
