# checklist

- [ ] TK-475 cut over runtime session durable truth to sqlite-fs default and durable schema baseline
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 sqlite-fs default cutover、session durable schema baseline 与 provider/distribution truth 对齐。

- [ ] TK-476 migrate shared session manager and runtime consumers to append-only session event log semantics
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 `SharedSessionManager`、`/resume`、replay 与 diagnostics 从 session blob rewrite 迁移到 event-log-based 模型。
