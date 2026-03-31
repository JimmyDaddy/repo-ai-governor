# sprint-001-activation-and-session-main-contract-delta 计划

- Status: completed
- Date: 2026-03-31
- Project: `project-033-session-main-agent-runtime-productization`
- Sprint Goal: 按路径 A 激活 follow-up project，并把 `session.main` 的 contract delta、turn result semantics 与 path-A phase map 固化为正式执行输入。

## 1. Task Package

1. `TK-451` activate project-033 and sync path-A phase map
2. `TK-452` formalize session.main contract delta and structured turn semantics

## 2. Exit Criteria

1. `project-033` 的 project / sprint / task surface 已建立，并登记到 `current-context.md` 的 planned follow-up streams。
2. `session.main` 与当前 `baseline_ack` 实现的缺口被明确写成 contract delta，而不是只留在 draft prose。
3. path-A 的输入输出语义至少覆盖：
   - user turn request
   - assistant delta / completion / failure
   - suggested slash command
   - execution intent
   - follow-up question
   - adapter selection metadata
4. 后续 `TK-453 ~ TK-458` 的实现边界已经被 contract delta 限定，不会把前台主 agent 与后台编排角色重新耦合。

## 3. Milestones

1. 2026-03-31：创建 `sprint-001` planning surface，并将 `TK-451 ~ TK-452` 写入 sprint task package。
2. 2026-03-31：完成 `TK-451 ~ TK-452`，建立 `project-033` planning surface，并把 `session.main` contract delta、structured turn semantics 与 path-A implementation ordering 写回 draft。
