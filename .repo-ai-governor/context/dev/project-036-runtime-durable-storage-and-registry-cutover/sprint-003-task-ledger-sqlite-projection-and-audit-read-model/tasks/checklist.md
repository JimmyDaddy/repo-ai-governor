# checklist

- [x] TK-478 build tasks.csv sqlite projection and route audit/query consumers through it
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 `tasks.csv` sqlite projection/read-model 与 consumer 切换。
  - 2026-04-02：`TK-478` 已切换为 `active`；随 `sprint-003` 成为当前 primary planning surface，开始进入 `tasks.csv` sqlite projection/read-model 的实施窗口。
  - 2026-04-02：已建立 `scripts/governance/task-ledger-projection.js` 与 sqlite read-model rebuild 机制，并让 `check-sprint-plan-status-sync`、`check-technical-solution-delivery-registry`、`check-artifact-registry-lifecycle`、`reconcile-artifact-dependencies` 优先消费 projection。
  - 2026-04-02：已补齐 projection integration test、治理脚本 dry-run / gate 验证与 `pnpm run build` 证据，`TK-478` 收口为 `completed`。
