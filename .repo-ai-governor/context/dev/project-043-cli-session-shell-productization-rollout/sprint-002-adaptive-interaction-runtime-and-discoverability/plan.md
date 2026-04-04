# sprint-002-adaptive-interaction-runtime-and-discoverability 计划

- Status: planned
- Date: 2026-04-04
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint Goal: 为 interactive shell 建立 adaptive interaction runtime policy，并让 skills/presets/builtins 进入统一 discoverability surface。

## 1. Task Package

1. `TK-533` freeze adaptive interaction runtime policy and unified discoverability registry baseline
2. `TK-534` implement alt-screen inline overlay fallback runtime and request-user-input seam
3. `TK-535` add skills presets builtins unified discoverability registry presenter and regression acceptance

## 2. Exit Criteria

1. `alt-screen / inline / overlay / fallback` 的统一 policy 已冻结为实现输入。
2. request-user-input 不再由各命令各自拼 prompt，而是进入统一输入层 seam。
3. repository-local skills、workflow presets、doctor/delivery presets 与 shell-local builtins 已能进入统一 discoverability registry。
4. sprint 台账与 current-context planned stream 已与本次 decomposition 保持同步。

## 3. Milestones

1. 2026-04-04：创建 `sprint-002-adaptive-interaction-runtime-and-discoverability`，作为 `project-043` 的第二条 planned execution sprint。
2. 2026-04-04：完成 `TK-533`、`TK-534`、`TK-535` 任务卡拆解。
