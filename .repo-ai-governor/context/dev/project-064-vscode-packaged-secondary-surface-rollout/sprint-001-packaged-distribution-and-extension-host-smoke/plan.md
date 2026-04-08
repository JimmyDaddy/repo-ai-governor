# sprint-001-packaged-distribution-and-extension-host-smoke 计划

- Status: completed
- Date: 2026-04-08
- Project: `project-064-vscode-packaged-secondary-surface-rollout`
- Sprint Goal: 为 VS Code secondary surface 建立 packaged distribution 与 smoke gate。

## 1. Task Package

1. `TK-670` freeze VS Code packaged distribution contract and smoke gate
2. `TK-671` implement VSIX build release path and extension-host smoke follow-up
3. `TK-672` close VS Code packaged secondary-surface support declaration
4. `TK-704` sprint-001 exit acceptance and project-final review activation handoff
5. `TK-705` finalize project-064 closeout and activate project-065 primary stream

## 2. Exit Criteria

1. VS Code packaged distribution contract 与 smoke gate 已冻结。
2. VSIX build/release path 与 extension-host smoke 已具备最小闭环。
3. support matrix、README 与 smoke evidence 已同步。
4. sprint-level clean closure 已写回，并将当前 sprint surface 固定为 project-final delegated CR loop 的默认面。
5. project-final clean closure 已完成，并已把主执行流切换到 `project-065 / sprint-001 / TK-673`。

## 3. Milestones

1. 2026-04-08：作为 `project-064` follow-up sprint 创建，当前保持 `planned`。
2. 2026-04-08：在 `project-067` final closeout 完成后被激活为当前 primary sprint，`TK-670` 已切换为 `in_progress`。
3. 2026-04-08：`TK-670 ~ TK-672` 已完成实现与验证，当前 sprint 等待 CR loop 与 closeout 收口。
4. 2026-04-08：`CR-001` clean `resolved`；`TK-704 / DA-704` 已完成 sprint closeout handoff，当前 sprint surface 继续保持 `active`，但仅供 `project-064` project-final CR loop 使用。
5. 2026-04-08：`CR-002` clean `resolved`；`TK-705 / DA-705` 已完成 project-final closeout write-back，当前 sprint 已恢复为最终 `completed` 真值并移入 completed history。
