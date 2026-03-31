# checklist

- [x] TK-467 stabilize serial role collaboration and interaction-mode routing
  - 2026-03-31：任务创建，状态初始化为 `planned`；承接 `session.main` 从 single-role delegate 走向 serial collaboration 的 Phase B 起点。
  - 2026-03-31：`sprint-003` 已激活，`TK-467` 切换为 `active`；当前先收敛一条 `planner -> reviewer` 风格的串行协作路径，并稳定 interaction-mode routing / metadata 投影。
  - 2026-03-31：已完成 `@planner @reviewer` 串行协作基线、`routerDecisionReason` 投影与 serial collaboration parity 回归；后续 `TK-468` 承接 parallel fan-out 与 collaboration recap presenter 分层。

- [ ] TK-468 expand parallel role fan-out and collaboration recap presentation semantics
  - 2026-03-31：任务创建，状态初始化为 `planned`；在 serial collaboration 后补 parallel analysis 与 collaboration recap presenter 分层。
  - 2026-03-31：`TK-468` 已切换为 `active`；当前先收敛一条受治理的 parallel analysis path，并让 collaboration recap 与 command handoff recap 的 transcript 语义显式区分。
