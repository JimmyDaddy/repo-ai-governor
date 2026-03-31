# checklist

- [x] TK-453 implement service-owned session.main dispatcher and replace baseline ack
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是将 `sendSessionTurn()` 从 `baseline_ack` 升级为真实主 agent dispatcher。
  - 2026-03-31：已新增 `LocalOrchestrationServiceSessionMainAgentDispatcher`，让 `session.main` 输出 structured handoff preview metadata，并替换 `baseline_ack`。
- [x] TK-454 stream assistant delta completion and failure metadata through session events
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是继续把 richer delta/completed/failure/cancelled 语义补入 shared session event contract。
  - 2026-03-31：已补齐 `TURN_FAILED / TURN_CANCELLED` shared session event types，并让 service runtime 与 transcript presenter 覆盖失败/取消 turn 语义。
