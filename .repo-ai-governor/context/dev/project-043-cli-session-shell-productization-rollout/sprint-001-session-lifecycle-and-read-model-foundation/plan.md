# sprint-001-session-lifecycle-and-read-model-foundation 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint Goal: 为 session shell 补齐 lifecycle action seam 与 session projection/read-model 基线。

## 1. Task Package

1. `TK-530` freeze session lifecycle dto action seam and projection schema baseline
2. `TK-531` implement session lifecycle service actions and sqlite-backed session projection read model
3. `TK-532` wire resume picker session list fork archive presenter and regression acceptance

## 2. Exit Criteria

1. lifecycle action seam 的 DTO、状态边界与 read-model 字段已经冻结为统一实现输入。
2. `fork / archive / unarchive` 与 session projection/read-model 已在 service/runtime 层连通，而不是停留在 presenter 想象层。
3. session shell 已能消费 projection 做 recent list、resume picker 与 fork/archive affordance，而不是重复维护 shadow index。
4. sprint 台账与 current-context planned stream 已与本次 decomposition 保持同步。

## 3. Milestones

1. 2026-04-04：创建 `sprint-001-session-lifecycle-and-read-model-foundation`，作为 `project-043` 的首个 planned execution sprint。
2. 2026-04-04：完成 `TK-530`、`TK-531`、`TK-532` 任务卡拆解，并将 `project-043 / sprint-001` 登记到 `current-context.md` planned follow-up streams。
3. 2026-04-04：已确认 service-backed session lifecycle seam、transcript projection/read-model 与 resume/list continuity 已在 `apps/cli` 落地，并通过 build + session-shell package/integration suites 验证。
