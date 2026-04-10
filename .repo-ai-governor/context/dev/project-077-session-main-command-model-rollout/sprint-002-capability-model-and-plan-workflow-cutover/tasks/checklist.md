# checklist

- [x] TK-729 freeze session.main capability interaction model contract
  - 2026-04-10：任务创建，状态初始化为 `in_progress`。
  - 2026-04-10：在 `packages/core-orchestration-service` 的 capability constants / alias types / descriptor interfaces / catalog producer 中补齐 `interactionModel`、`primaryEntry`、`backingExecution` 及 related metadata，并把 public `VERIFY` 从 governed capability catalog 移除。
  - 2026-04-10：补齐 catalog unit coverage，确认 `PLAN`、`REVIEW`、`REVIEW_VERIFY`、`RUN` 等 capability metadata 与 formal contract 对齐。
- [x] TK-730 cut over capability catalog explainer and discoverability to the new plan workflow model
  - 2026-04-10：任务创建，状态初始化为 `planned`。
  - 2026-04-10：从 public capability explainer / discoverability order 中移除 `verify`，并把 `/plan` detail/help wording 改写为 productized workflow、`/plan sync` deterministic bridge、`@planner` raw role 的三层心智。
  - 2026-04-10：补齐中英文 i18n 与 CLI help appendix consumer path，同时把 `runtime.cli-interactive-shell` 对 command-model contract 的 consumer 关系写回 canonical module registry。
- [x] TK-731 cut over planning routing and slash surfaces to `/plan` workflow plus `/plan sync` bridge
  - 2026-04-10：任务创建，状态初始化为 `planned`。
  - 2026-04-10：把 natural-language planning request 改为在有 supervisor runtime 时隐式委托给 `planner` role，而不再默认桥接裸 `plan --output pretty`。
  - 2026-04-10：为 session shell 增加 `/plan` AI workflow 和 `/plan sync` deterministic bridge 语义，同时保留 hidden `/verify` 兼容入口以等待 sprint-003 正式删除。
  - 2026-04-10：补齐 session-shell / parity / output-contract 回归，确认新的 planning routing 与 discoverability 通过 targeted tests 与 `pnpm run build`。
- [x] CR-001 sprint-002-capability-model-and-plan-workflow-cutover delegated review loop round 1
  - 2026-04-10：任务创建，状态初始化为 `review_pending`。
  - 2026-04-10：fresh delegated reviewer 返回 3 条 finding；主 agent 复核后接受 `session-slash-command-registry` 参数 lower-case 漂移，确认 `/plan` transcript 覆盖与 `planSync` locale 缺失两条为 stale finding。
  - 2026-04-10：已修复 `/plan` 与 `/plan sync` 的参数保真问题，并补上 mixed-case 回归测试；`pnpm run build`、targeted vitest、task-ledger 与 code-review 状态检查通过。
  - 2026-04-10：`CR-001` 已推进到 `resolved`；`check-sprint-plan-status-sync` 仍报 `project-076 / sprint-003` 并行 stream 既有状态漂移，未在本轮越界改写。
