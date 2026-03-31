# sprint-002-answer-supervisor-and-role-subagent-bootstrap 计划

- Status: completed
- Date: 2026-03-31
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint Goal: 为 `session.main` 建立 direct answer bootstrap、single-role subagent path 与 command handoff governance baseline。

## 1. Task Package

1. `TK-465` bootstrap service-owned session.main supervisor and direct answer path
2. `TK-466` productize role-subagent collaboration and command handoff governance baseline

## 2. Exit Criteria

1. `session.main` supervisor 在至少一个真实自然语言 turn 上返回真正的 `assistantMessage`，不再只停留在 metadata recap。
2. 至少一条可工作的 role-subagent path 被 productize，并能把 `invokedRoleIds[]` 等最小协作 metadata 写回 shared session truth。
3. natural-language command handoff 继续走 preview + confirm，不突破高副作用治理边界。
4. `sprint-003` 与 `sprint-004` 的 planned truth 已存在，确保 bootstrap 不会被误读为 full collaboration/streaming closeout。
5. `project-035` 的 docs / review / rollout evidence 与 `current-context.md` planned stream surface 保持同步。

## 3. Milestones

1. 2026-03-31：基于 `TK-464` promotion cutover，创建 `sprint-002` 作为 bootstrap implementation surface。
2. 2026-03-31：冻结 `TK-465 ~ TK-466`，将 direct answer、single-role subagent path 与 command handoff governance 收敛为后续 task package。
3. 2026-03-31：同步将 serial/parallel collaboration 与 streaming/host parity 拆到 `sprint-003 ~ sprint-004`，避免 `sprint-002` 范围继续膨胀。
4. 2026-03-31：显式激活 `sprint-002` 作为 `project-035` 当前 primary execution surface；先从 `TK-465` 开始实现 direct answer bootstrap 与最小 shared session metadata seam。
5. 2026-03-31：完成 `TK-465`；`session.main` 现已支持 service-owned direct answer path、最小 supervisor metadata 回灌，以及 CLI/resume 的 markdown answer parity regression。
6. 2026-03-31：完成 `TK-466`；`session.main` 现已具备 `@planner` single-role delegate 试点、`subagentCount` shared session metadata，以及 role mention 不绕过 connect-like handoff governance 的 baseline。
7. 2026-03-31：补齐 `core-orchestration-service` 轻量子入口，解除 CLI help 对 sqlite shell 的非必要预加载；`cli-help.e2e` 与 `pnpm run check` 已全量通过。
