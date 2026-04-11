# sprint-001-live-theme-apply-fix 计划

- Status: completed
- Date: 2026-04-11
- Project: `project-084-session-shell-theme-apply-followup`
- Sprint Goal: 修复 `workspace set-ui-theme` 成功后当前 session shell 不立即应用新主题的问题，并完成回归验证与 closeout。

## 1. Task Package

1. `TK-771` fix session-shell live theme apply after workspace set-ui-theme succeeds
2. `TK-772` finalize project-084 closeout after live theme apply fix

## 2. Exit Criteria

1. `workspace set-ui-theme calm` 等命令成功后，前台 shell frame 的 `themePreset` 会立即更新。
2. session-shell runner 回归测试覆盖该即时主题应用行为。
3. sprint 台账、plan 与 `current-context.md` 在 closeout 时保持同步。

## 3. 里程碑记录

1. 2026-04-11：作为 `project-084` 的唯一 sprint 创建，并立即成为当前 active primary stream。
2. 2026-04-11：范围锁定为“theme persistence succeeded but live shell did not apply it”的 runtime follow-up，而不是新的主题能力扩张。
3. 2026-04-11：`TK-771` 已完成 runtime 修复与回归验证，`TK-772` 已完成 completion audit、completed history 回写与 idle context 恢复。
