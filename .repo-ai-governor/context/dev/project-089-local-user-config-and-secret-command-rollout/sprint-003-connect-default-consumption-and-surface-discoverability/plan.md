# sprint-003-connect-default-consumption-and-surface-discoverability 计划

- Status: completed
- Date: 2026-04-11
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint Goal: 让 `connect` consume user defaults，补 session shell discoverability，并在 evidence gate 通过时升级 adopter docs / playbook。

## 1. Task Package

1. `TK-796` consume user-config remote-api defaults in connect with analyze-first candidate materialization
2. `TK-797` add session shell config and secret discoverability plus command guidance
3. `TK-798` uplift adopter docs and playbook wording only when evidence gate passes
4. `TK-799` finalize project-089 rollout closeout and delivery evidence handoff

## 2. Exit Criteria

1. `connect` 已能在不破坏 analyze-first / canonical truth 边界的前提下 consume user defaults。
2. session shell `/config` 与 `/secret` discoverability 已稳定回链到同一 command contract。
3. adopter docs / playbook wording uplift 只会在 evidence gate 通过时发生，并写回 delivery evidence。

## 3. Milestones

1. 2026-04-11：作为 `project-089` 的第三阶段 execution surface 创建，当前保持 `planned`。
2. 2026-04-12：`TK-795 / DA-795` 已完成 sprint-002 closeout 与 activation handoff，当前已切换为 active sprint，`TK-796` 进入 `in_progress`。
3. 2026-04-12：`TK-796 ~ TK-798` 已完成，并通过 `pnpm run build` 与 sprint-003 focused verification suite；当前边界进入 fresh delegated CR loop。
4. 2026-04-12：`CR-001` 已 clean `resolved`，当前 sprint 已完成 implementation boundary delegated CR loop，并继续作为 project-final review surface。
5. 2026-04-12：`CR-002` 已 clean `resolved`，`TK-799 / DA-799` 已完成 project-final closeout；当前 sprint 恢复为最终 `completed` 真值。
