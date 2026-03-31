# sprint-002-service-owned-session-main-dispatcher 计划

- Status: completed
- Date: 2026-03-31
- Project: `project-033-session-main-agent-runtime-productization`
- Sprint Goal: 将 `session.main` 从 `baseline_ack` 升级为真实 service-owned dispatcher，并补齐 assistant delta/completed metadata 的可消费基线。

## 1. Task Package

1. `TK-453` implement service-owned session.main dispatcher and replace baseline ack
2. `TK-454` stream assistant delta completion and failure metadata through session events

## 2. Exit Criteria

1. `sendSessionTurn()` 不再写入 `responseMode=baseline_ack`。
2. `TURN_STREAM_DELTA` 与 `TURN_COMPLETED` 至少承载真实的主 agent structured result 或 handoff preview metadata。
3. CLI transcript store 能消费新的 structured payload，而不再只显示 `accepted + echo` 占位语义。
4. build 与 targeted tests 覆盖 service runtime 和 transcript presenter 两侧。

## 3. Milestones

1. 2026-03-31：创建 `sprint-002` planning surface，并将 `TK-453 ~ TK-454` 写入 task package。
2. 2026-03-31：完成 `TK-453`，新增 service-owned main-agent dispatcher，替换 `baseline_ack`，并让 transcript store 渲染 command handoff preview metadata。
3. 2026-03-31：完成 `TK-454`，补齐 `TURN_FAILED / TURN_CANCELLED` shared session event semantics、service runtime failure/cancellation path 与 transcript presenter 渲染。
