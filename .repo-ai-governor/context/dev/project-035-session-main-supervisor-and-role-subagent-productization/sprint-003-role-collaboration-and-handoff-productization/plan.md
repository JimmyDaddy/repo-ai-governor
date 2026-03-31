# sprint-003-role-collaboration-and-handoff-productization 计划

- Status: active
- Date: 2026-03-31
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint Goal: 将 `session.main` 从 single-role bootstrap 扩展到可审计的 serial/parallel role collaboration，并收口自然语言 command handoff 的协作与 recap 语义。

## 1. Task Package

1. `TK-467` stabilize serial role collaboration and interaction-mode routing
2. `TK-468` expand parallel role fan-out and collaboration recap presentation semantics

## 2. Exit Criteria

1. `session.main` 至少支持一条真实 `serial role collaboration` 路径，例如 `planner -> reviewer`。
2. `session.main` 至少支持一条受控 `parallel role fan-out` 分析路径，并能把结果汇总为用户可读回答。
3. `interactionMode / invokedRoleIds[] / subagentCount / synthesisMode` 等最小协作 metadata 已稳定写回 shared session truth。
4. natural-language command handoff 与 multi-role collaboration 的 presenter 语义已分层清晰，不把运行中状态错误挤进 transcript。

## 3. Milestones

1. 2026-03-31：创建 `sprint-003`，将 multi-role collaboration 与 collaboration recap presenter 明确拆出，避免和 bootstrap sprint 混写。
2. 2026-03-31：冻结 `TK-467 ~ TK-468`，分别承接 serial collaboration/router stabilization 与 parallel fan-out/presenter semantics。
3. 2026-03-31：正式激活 `sprint-003` 作为 `project-035` 当前 primary execution surface；先从 `TK-467` 开始收敛 serial collaboration path 与 interaction-mode routing。
4. 2026-03-31：完成 `TK-467`；当前已把显式双 role mention 收敛到一条受审计的 `planner -> reviewer` 串行协作路径，并将 `routerDecisionReason` / `interactionMode` / `invokedRoleIds` / `subagentCount` 写回 shared session truth。
