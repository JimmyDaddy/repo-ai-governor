# sprint-001-targeted-biome-format-repair 计划

- Status: completed
- Date: 2026-04-21
- Project: `project-118-working-tree-format-drift-remediation`
- Sprint Goal: 修复当前 dirty worktree 中已知的 targeted biome format drift 并完成 scoped closeout。

## 1. Task Package

1. `TK-1027` repair targeted biome format drift on existing working-tree files
2. `TK-1028` verify targeted format repair against build and gate outputs
3. `TK-1029` finalize project-118 closeout and restore idle context
4. `CR-001` review project-118 targeted format repair window

## 2. Exit Criteria

1. 目标文件的 format drift 已修复。
2. `pnpm run build` 通过。
3. `pnpm run check` 不再被当前这组文件的 format drift 阻塞。
4. scoped review clean 收口，并将 project/sprint/context 恢复到最终真值。

## 3. Milestones

1. 2026-04-21：作为新的 scoped remediation sprint 创建，并在同窗口激活为 primary execution surface。
2. 2026-04-21：`TK-1027` 切换为 `in_progress`，用于执行 targeted biome format repair。
3. 2026-04-21：`TK-1027` 已完成 4 个 formatter 点名文件的定向写回，未扩大 scope。
4. 2026-04-21：`TK-1028` 已完成验证；`pnpm run build` 通过，targeted biome formatter-only check clean，整仓 `pnpm run check` 的剩余失败已收敛到 scope 外 standardized-error 违规。
5. 2026-04-21：`CR-001` 已完成 scoped review；当前 sprint 内无阻止 closeout 的 actionable finding。
6. 2026-04-21：`TK-1029` 已完成 completion audit、current-context idle 恢复与 completed history write-back，当前 sprint 恢复为最终 `completed` 真值。
