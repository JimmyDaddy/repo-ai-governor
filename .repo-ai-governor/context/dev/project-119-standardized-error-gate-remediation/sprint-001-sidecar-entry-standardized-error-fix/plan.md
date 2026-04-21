# sprint-001-sidecar-entry-standardized-error-fix 计划

- Status: completed
- Date: 2026-04-21
- Project: `project-119-standardized-error-gate-remediation`
- Sprint Goal: 修复 sidecar entry 的 standardized-error 违规并完成 scoped closeout。

## 1. Task Package

1. `TK-1030` remediate standardized error usage in local orchestration sidecar entry
2. `TK-1031` verify standardized error remediation against build and gate outputs
3. `TK-1032` finalize project-119 closeout and restore idle context
4. `CR-001` review project-119 standardized error remediation window

## 2. Exit Criteria

1. 目标 standardized-error 违规已修复。
2. `node ./scripts/governance/check-standardized-error-usage.js` 通过。
3. `pnpm run build` 通过。
4. `pnpm run check` 不再被当前这条违规阻塞。
5. scoped review clean 收口，并将 project/sprint/context 恢复到最终真值。

## 3. Milestones

1. 2026-04-21：作为新的 scoped remediation sprint 创建，并在同窗口激活为 primary execution surface。
2. 2026-04-21：`TK-1030` 切换为 `in_progress`，用于执行 targeted standardized-error remediation。
3. 2026-04-21：`TK-1030` 已完成目标文件的 standardized-error 修复，未扩大 scope。
4. 2026-04-21：`TK-1031` 已完成验证；`check-standardized-error-usage.js`、`pnpm run build` 与 `pnpm run check` 均 clean。
5. 2026-04-21：`CR-001` 已完成 scoped review；当前 sprint 内无阻止 closeout 的 actionable finding。
6. 2026-04-21：`TK-1032` 已完成 completion audit、current-context idle 恢复与 completed history write-back，当前 sprint 恢复为最终 `completed` 真值。
