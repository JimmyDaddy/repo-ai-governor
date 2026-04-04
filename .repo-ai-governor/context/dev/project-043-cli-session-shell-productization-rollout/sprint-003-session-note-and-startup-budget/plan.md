# sprint-003-session-note-and-startup-budget 计划

- Status: planned
- Date: 2026-04-04
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint Goal: 为 session continuity 建立 lightweight session note，并给 session-first entry 建立 startup budget 与 lazy-load 治理。

## 1. Task Package

1. `TK-536` freeze session note trigger schema and startup budget instrumentation boundary
2. `TK-537` implement session note persistence projection and session-shell startup lazy-load cutover
3. `TK-538` add session note presenter startup diagnostics regression evidence and rollout closeout acceptance

## 2. Exit Criteria

1. session note 的 trigger / schema / projection 边界已经冻结为统一实现输入。
2. session note 已能作为 presenter-safe continuity affordance 进入 session shell，而不是暗箱 memory。
3. 无子命令 session-first startup path 已具备明确的 lazy-load boundary 与 startup diagnostics。
4. sprint 台账与 current-context planned stream 已与本次 decomposition 保持同步。

## 3. Milestones

1. 2026-04-04：创建 `sprint-003-session-note-and-startup-budget`，作为 `project-043` 的第三条 planned execution sprint。
2. 2026-04-04：完成 `TK-536`、`TK-537`、`TK-538` 任务卡拆解。
