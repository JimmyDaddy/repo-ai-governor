# sprint-002-vscode-editor-companion-mvp 计划

- Status: completed
- Date: 2026-04-05
- Project: `project-048-governance-surface-clients-rollout`
- Sprint Goal: 落地 VS Code editor companion MVP 的 extension contract、view/chat/tool/command surface。

## 1. Task Package

1. `TK-562` freeze VS Code editor companion MVP extension contract and surface boundary
2. `TK-563` implement Governor view container chat participant and editor local governed commands
3. `TK-564` wire review hitl context views workspace trust gating and extension acceptance

## 2. Exit Criteria

1. 插件 MVP 已明确采用 lightweight views + chat participant + commands/code actions + detail-only webview。
2. extension host 不维护 shadow runtime，仅消费 shared identifiers 与 service-owned query/command seam。
3. workspace trust gating 与 editor-local handoff 已进入正式 acceptance 范围。

## 3. Milestones

1. 2026-04-05：创建 `sprint-002-vscode-editor-companion-mvp`，作为 VS Code companion rollout sprint。
2. 2026-04-05：在 `sprint-001` reviewer loop 收口后切换为 active primary sprint，并激活 `TK-562` 冻结 extension contract、surface boundary 与 workspace trust gating。
3. 2026-04-05：已完成 `TK-562` contract freeze 与 `TK-563` implementation，并将 `TK-564` 推进到 acceptance + reviewer closeout 阶段；当前 sprint 保持 `active` 以承接 reviewer 子 agent CR 闭环。
4. 2026-04-05：reviewer 子 agent 第二轮复审返回 `No actionable findings.`，`sprint-002-vscode-editor-companion-mvp` 正式收口为 `completed`。
