# checklist

- [x] TK-487 roll codex onto shared invoke liveness watchdog graceful interrupt and partial output preservation
  - 2026-04-02：任务创建，状态初始化为 `planned`。
  - 2026-04-03：由 `sprint-001` 迁入；承接残余 Codex-specific watchdog、graceful interrupt、hard terminate、partial-output preservation 与 reviewer 长任务保护 closeout。
  - 2026-04-03：随着 `TK-489` 收口、`sprint-002` 完成，本任务被提升为新的 primary implementation surface，状态切换为 `active`。
  - 2026-04-03：完成 Codex `cli_exec` invoke-liveness 补齐：shared snapshot、`transport_idle_suspect / semantic_stall_suspect / graceful_interrupting / hard_terminating`、dual-stage terminate fuse、partial-output preservation 与 smoke 回归已全部通过；任务状态切换为 `completed`。

- [x] TK-490 route session-main interactive shell and doctor verify through invoke liveness diagnostics
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 session.main、interactive shell、doctor/verify 与 invoke-liveness diagnostics 的正式接线。
  - 2026-04-03：任务状态切换为 `active`，开始补齐 session.main live shell 呈现、execution details 与 doctor/verify invoke-liveness diagnostics 投影。
  - 2026-04-03：任务完成：interactive shell 已显式呈现 suspect stall / graceful interrupt / partial output preserved，execution details 会保留这些细节；doctor/verify matrix/detail 已补齐 cancellation mode、reason codes 与 budget diagnostics，并通过定向回归、i18n gate、台账 gate 与 `build`。

- [x] TK-491 deliver invoke liveness regression budgets cutover governance and rollout closeout
  - 2026-04-02：任务创建，状态初始化为 `planned`；承接 budget matrix、cutover governance、回归矩阵与项目 closeout 收口。
  - 2026-04-03：状态切换为 `active`，已冻结首版 `invoke-liveness-budget-regression-and-closeout-baseline.md`，开始汇总 route/role/surface budget truth、回归矩阵与 cutover/rollback 边界。
  - 2026-04-03：任务完成：已产出 `DA-491`、`project-037` completion audit summary，并将 `technical-solution.agent-invoke-liveness-and-timeout-governance` delivery entry、project/sprint plan 与 task ledger 全部同步为 completed。
