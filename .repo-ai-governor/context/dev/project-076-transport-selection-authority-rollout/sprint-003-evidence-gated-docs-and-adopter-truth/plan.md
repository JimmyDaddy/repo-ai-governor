# sprint-003-evidence-gated-docs-and-adopter-truth 计划

- Status: completed
- Date: 2026-04-09
- Project: `project-076-transport-selection-authority-rollout`
- Sprint Goal: 产出 clean-room / verify evidence，并仅在 gate 通过时升级 public support wording 与 delivery closeout。

## 1. Task Package

1. `TK-732` produce clean-room and verify evidence for codex and claude-code remote_api paths
2. `TK-733` uplift adopter-facing support wording only when evidence gate passes
3. `TK-734` finalize rollout closeout and delivery evidence handoff

## 2. Exit Criteria

1. clean-room / verify evidence 已能证明 `remote_api` 路径独立完成 probe / invoke 且保持 fail-closed truth。
2. 只有在 evidence gate 通过时，`docs/support-matrix*` 与 `docs/local-adoption-playbook*` 才被 uplift。
3. delivery registry、handoff artifact 与 closeout evidence 已同步。

## 3. Milestones

1. 2026-04-09：作为 `project-076` 的第三阶段 execution surface 创建，初始状态为 `planned`。
2. 2026-04-10：`TK-736 / DA-736` 完成 sprint-002 closeout 与 activation handoff 后，`sprint-003` 被激活为当前 primary sprint，`TK-732` 已切换为 `in_progress`。
3. 2026-04-10：`TK-732 / DA-732` 已完成 Codex / Claude Code 显式 `remote_api` 的 verify、packaged distribution 与 clean-room 证据汇总，gate verdict 为 `passed`。
4. 2026-04-10：`TK-733` 已据此完成 adopter-facing docs wording uplift；当前 sprint 的下一边界固定为 scoped CR loop。
5. 2026-04-10：`CR-001` 已 resolved，`TK-734` 当前处于 `in_progress`，并已产出 `DA-734` 与 project completion audit baseline；下一边界为 project-final delegated CR。
6. 2026-04-10：`CR-002` 已修复并收口，`TK-734 / DA-734` 已完成 final closeout write-back；当前 sprint 恢复为最终 `completed` 真值。
