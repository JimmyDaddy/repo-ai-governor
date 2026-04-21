# sprint-001-backlog-clearance-and-doc-truth-alignment 计划

- Status: completed
- Date: 2026-04-21
- Project: `project-117-artifact-lifecycle-and-gate-contract-remediation`
- Sprint Goal: 完成 draft 沉淀、artifact lifecycle backlog 清理与治理脚本文档口径收口。

## 1. Task Package

1. `TK-1023` capture current improvement summary draft and activate remediation stream
2. `TK-1024` remediate artifact registry lifecycle backlog and refresh canonical views
3. `TK-1025` align governance gate roadmap with executable script truth
4. `TK-1026` finalize project-117 closeout and restore idle context
5. `CR-001` review project-117 remediation window and confirm clean closeout

## 2. Exit Criteria

1. 当前仓库体检结论已落盘为 supplemental draft，并完成 lifecycle write-back。
2. artifact lifecycle canonical maintenance 已执行，主/归档 registry views 与 gate 结果一致。
3. 规范文档不再把缺失脚本描述为已准备接入的真实脚本资产。
4. remediation window 完成 review clean closure，并将 project/sprint/context 恢复到最终真值。
5. 若整仓 `pnpm run check` 仍失败，剩余失败必须被明确记录为 scope 外 dirty-worktree drift。

## 3. Milestones

1. 2026-04-21：作为 idle context 下的新 remediation sprint 创建，并在同窗口激活为 primary execution surface。
2. 2026-04-21：`TK-1023` 切换为 `in_progress`，用于先完成 draft 沉淀与执行面启动。
3. 2026-04-21：`TK-1024` 已完成 artifact lifecycle dry-run/apply，并恢复 artifact lifecycle gate clean baseline。
4. 2026-04-21：`TK-1025` 已完成治理脚本文档口径收口，normative-loading gate 通过。
5. 2026-04-21：`CR-001` 已完成 scoped review；scope 内无剩余 actionable finding，整仓 `pnpm run check` 的剩余失败仅来自 scope 外的 biome format drift。
6. 2026-04-21：`TK-1026` 已完成 completion audit、current-context idle 恢复与 completed history write-back，当前 sprint 恢复为最终 `completed` 真值。
