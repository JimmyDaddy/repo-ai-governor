# checklist

- [x] TK-517 rename task-ledger sqlite canonical storage naming and migrate legacy naming
  - 2026-04-04：任务创建，状态初始化为 `planned`。
  - 2026-04-04：开始将 task ledger sqlite 默认文件名切到 `task-ledger.sqlite`，并为 legacy 文件名/表名/索引名补齐自动迁移。
  - 2026-04-04：已完成 canonical sqlite 文件名、表名与 legacy naming 自动迁移收口，并补齐 migration regression coverage。
- [x] TK-518 align cli durable-storage diagnostics docs and regression coverage with canonical task-ledger naming
  - 2026-04-04：任务创建，状态初始化为 `planned`。
  - 2026-04-04：开始同步 `doctor / verify` durable-storage diagnostics、formal docs 与 project-040 closeout evidence。
  - 2026-04-04：已完成 CLI diagnostics canonical naming 对齐、review-chain managed ledger backfill regression fix、docs/plan/audit summary 同步与定向验证回链。
