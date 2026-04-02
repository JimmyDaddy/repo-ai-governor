# checklist

- [x] TK-475 cut over runtime session durable truth to sqlite-fs default and durable schema baseline
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 sqlite-fs default cutover、session durable schema baseline 与 provider/distribution truth 对齐。
  - 2026-04-02：`TK-475` 已切换为 `active`；开始梳理 memory provider 默认值、distribution truth、doctor/verify expectation 与 session durable schema 的第一阶段实现边界。
  - 2026-04-02：完成第一批默认切换实现：`DEFAULT_MEMORY_STORE_ENGINE` 改为 `sqlite_fs`，`sqlite-fs` built-in distribution mode 改为 `default`，runtime/copy assets/release verify/cleanroom debug 脚本与 README expectation 已同步更新。
  - 2026-04-02：修复 `sqlite-fs` provider 在 key-prefix query 路径上的 `LIKE ESCAPE` 回归，并新增 unit/integration coverage；`run --dry-run --trace` 与 examples runtime smoke 不再因 `MEMORY_STORE_QUERY_FAILED` 失败。
  - 2026-04-02：验证通过：`pnpm exec biome check ...`、`vitest sqlite-fs provider + integration`、`pnpm run build`、`node ./scripts/examples/check-examples-runtime.js`、`node ./scripts/release/verify-local-distribution.js`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1`。
  - 2026-04-02：任务切换为 `completed`；补齐 docs/manifest/task-ledger gate、`sqlite-fs + session durable truth` 定向回归、`build`、examples runtime smoke、local distribution verify 与 clean-room install verify，确认 sprint-001 的 runtime durable truth foundation 已达到 exit criteria。

- [x] TK-476 migrate shared session manager and runtime consumers to append-only session event log semantics
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 `SharedSessionManager`、`/resume`、replay 与 diagnostics 从 session blob rewrite 迁移到 event-log-based 模型。
  - 2026-04-02：`TK-476` 已切换为 `active`；开始把 session durable write path 拆为 summary + event append + diagnostic projection。
  - 2026-04-02：`SharedSessionManager` 已改为 `session summary + append-only event records` 模型，并支持首次读取 legacy blob 时的透明迁移；turn terminal/detail-rich event 会额外写入 diagnostic projection。
  - 2026-04-02：`local-orchestration-service-session-runtime` 已把 `TURN_SUBMITTED` 作为 canonical `turnIndex` 的显式锚点，`turnCount` 不再依赖 terminal event 才固化。
  - 2026-04-02：验证通过：`biome`、`core-session + orchestration` 定向 vitest、`session-shell` 定向 vitest、`pnpm run build`。
  - 2026-04-02：任务切换为 `completed`；当前已通过 `SharedSessionManager` 的 summary + event-log hydrate 路径、legacy blob lazy migration、diagnostic projection、`TURN_SUBMITTED` 单调 turn 锚点和主要 runtime consumer 回归，满足 `TK-476` 交付边界。
