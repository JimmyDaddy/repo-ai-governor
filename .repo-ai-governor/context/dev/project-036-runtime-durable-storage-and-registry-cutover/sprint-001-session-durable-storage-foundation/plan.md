# sprint-001-session-durable-storage-foundation 计划

- Status: planned
- Date: 2026-04-02
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint Goal: 建立 sqlite-fs 默认 session durable truth、session durable schema baseline 与 append-only session event log 消费迁移面。

## 1. Task Package

1. `TK-475` cut over runtime session durable truth to sqlite-fs default and durable schema baseline
2. `TK-476` migrate shared session manager and runtime consumers to append-only session event log semantics

## 2. Exit Criteria

1. 默认 runtime memory engine 已对齐到 `sqlite-fs`，并明确 `fs-csv` 在 session 面上的 fallback/debug 定位。
2. runtime session durable truth 至少具备 `sessions + session_events + session_diagnostics` 或等价 schema/transaction 语义。
3. `SharedSessionManager` 与主要 consumer 不再以“整份 session payload blob 回写”为主模型。
4. `/resume`、replay 与 shell diagnostics 已有明确的 event-log-based 恢复路径和回归验证计划。

## 3. Milestones

1. 2026-04-02：创建 `sprint-001`，冻结 `TK-475 ~ TK-476` 作为 runtime session durable truth foundation package。
2. 2026-04-02：将 `sprint-001` 设为当前 primary planning surface，把 approved formal solution 转为首个实现窗口的任务拆解面。
