# checklist

- [x] TK-1030 remediate standardized error usage in local orchestration sidecar entry
  - 2026-04-21：任务创建，状态初始化为 `planned`。
  - 2026-04-21：`project-119 / sprint-001` 已创建并激活；当前任务切换为 `in_progress`，用于执行 targeted standardized-error remediation。
  - 2026-04-21：已在 `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts` 中引入 `standardizeError`，并将 `Failed to initialize session.main supervisor runtime` 的 `stderr` 写法切换为 `standardizeError(error).message`，从而移除当前 gate blocker。
- [x] TK-1031 verify standardized error remediation against build and gate outputs
  - 2026-04-21：任务创建，状态初始化为 `planned`。
  - 2026-04-21：`node ./scripts/governance/check-standardized-error-usage.js` 已通过，说明当前 standardized-error 违规已从 gate 结果中移除。
  - 2026-04-21：`pnpm run build` 已通过，说明修复后的代码面仍可正常构建。
  - 2026-04-21：`pnpm run check` 已完整通过，当前整仓 gate 已恢复 clean baseline。
- [x] TK-1032 finalize project-119 closeout and restore idle context
  - 2026-04-21：任务创建，状态初始化为 `planned`。
  - 2026-04-21：在 `TK-1030 / TK-1031 / CR-001` scoped clean 收口后，已完成 `project-119` completion audit、project/sprint `completed` write-back、completed history 追加与 idle context 恢复。
- [x] CR-001 review project-119 standardized error remediation window
  - 2026-04-21：任务创建，状态初始化为 `review_pending`。
  - 2026-04-21：已完成 scoped review。结论是 project-119 范围内无剩余 actionable finding；目标文件的 standardized-error 写法已修复，`check-standardized-error-usage.js`、`pnpm run build` 与 `pnpm run check` 均通过，因此本任务收口为 `resolved`。
