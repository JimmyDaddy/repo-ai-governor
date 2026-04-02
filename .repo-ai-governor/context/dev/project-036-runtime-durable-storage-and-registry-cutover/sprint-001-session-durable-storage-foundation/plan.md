# sprint-001-session-durable-storage-foundation 计划

- Status: completed
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
3. 2026-04-02：`TK-475` 已切换为 `active`；开始梳理 `fs_csv -> sqlite_fs` 默认切换、provider distribution truth 与 session durable schema baseline 的实现边界。
4. 2026-04-02：完成 `TK-475` 第一批默认切换实现：default memory engine / built-in distribution truth / examples-cleanroom bootstrap 已对齐到 `sqlite-fs`，并修复 sqlite provider key-prefix query 的 `LIKE ESCAPE` 回归；`build`、provider 测试、examples runtime smoke、local distribution verify 与 clean-room install 验证通过。
5. 2026-04-02：`TK-476` 已切换为 `active`；`SharedSessionManager` 首轮完成 `summary + append-only event records + diagnostic projection` 模型切换，并把 `TURN_SUBMITTED` 设为显式 canonical turn 锚点；`core-session`、`local-orchestration-service`、`session-shell` 定向回归和 `build` 通过。
6. 2026-04-02：`TK-476` 已切换为 `completed`；`SharedSessionManager` 不再依赖整份 session blob rewrite，legacy session 会在首次读取时懒迁移到 `session summary + append-only event records`，runtime consumer 继续通过 event-log hydrate 获取 `/resume`、replay 与 shell diagnostics 的恢复事实。
7. 2026-04-02：`TK-475` 已切换为 `completed`；最终验证通过 docs/manifest/task-ledger gate、runtime/session/provider 定向回归、`build`、examples runtime smoke、local distribution verify 与 clean-room install verify，确认 `sprint-001` 的 4 条 exit criteria 全部满足。
