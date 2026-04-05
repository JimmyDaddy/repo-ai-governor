# sprint-003-desktop-governance-evidence-surface 计划

- Status: completed
- Date: 2026-04-05
- Project: `project-048-governance-surface-clients-rollout`
- Sprint Goal: 为 desktop 补齐 policy trace、review lifecycle、artifact workbench detail 与 governance evidence surface。

## 1. Task Package

1. `TK-565` freeze governance evidence read model and artifact workbench detail contract
2. `TK-566` implement policy trace review lifecycle navigation and governance evidence surfaces
3. `TK-567` close desktop governance evidence surface with targeted verification and docs sync

## 2. Exit Criteria

1. `Policy & Standards Lens` 与 `Artifact & Review Workbench` 已拥有 detail read model。
2. review lifecycle、policy trace 与 evidence navigation 已形成 desktop 可用闭环。
3. 文档与 targeted verification 已同步。

## 3. Milestones

1. 2026-04-05：创建 `sprint-003-desktop-governance-evidence-surface`，作为 desktop governance differentiation sprint。
2. 2026-04-05：在 `sprint-002` reviewer loop 收口为零 actionable finding 后切换为 active primary sprint，并激活 `TK-565` 冻结 evidence read model、artifact workbench detail contract 与 review lifecycle baseline。
3. 2026-04-05：已完成 `TK-565` contract freeze、`TK-566` implementation、targeted tests、`pnpm run build`、`pnpm run check:desktop-entry-smoke` 与 desktop docs sync；当前 sprint 保持 `active` 以承接 reviewer 子 agent CR 闭环。
4. 2026-04-05：reviewer 子 agent 最终复审返回 `No actionable findings.`，`sprint-003-desktop-governance-evidence-surface` 正式收口为 `completed`。
