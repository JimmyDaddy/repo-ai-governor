# checklist

- [x] TK-230 sprint-003 激活与 sprint-002 closeout handoff
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始创建 sprint-003 skeleton、切换 current-context 并将 sprint-002 迁入 completed history。
  - 2026-03-26：已完成 sprint-003 skeleton、active execution surface 切换与 `DA-230`。
- [x] TK-231 upgrade command user path 与 confirmation/rollback reference baseline
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始盘点 `CliUpgradeCommand`、`UpgradeSchemaDiffService` 与相关 planner 能力的 adopter-facing 缺口。
  - 2026-03-26：已完成 upgrade adopter-facing CLI 收口，形成 `DA-231`，并通过 `tsc`、目标 vitest、`pnpm run test:integration` 与 `pnpm run check`。
- [x] TK-232 workspace lifecycle CLI dry-run/execute/rollback/failure-summary baseline
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始把 `WorkspaceMigrationService` 接成正式 `workspace` CLI 命令，并补齐 dry-run / execute / rollback / failure summary contract。
  - 2026-03-26：已完成 workspace lifecycle CLI 基线，形成 `DA-232`，并通过 command/runtime/output-contract 测试、`pnpm run test:integration` 与 `pnpm run check`。
- [x] TK-233 sprint-003 出口验收与 sprint-004 adopter pilot 输入约束
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始汇总 `TK-231`、`TK-232` 的验证结果并冻结 sprint-004 adopter pilot 输入约束。
  - 2026-03-26：已完成 sprint-003 exit acceptance，形成 `DA-233`，并将 sprint-003 切为 completed 真值、保留 current-context closeout surface。
