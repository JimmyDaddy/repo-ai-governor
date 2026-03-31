# sprint-003-role-collaboration-and-handoff-productization 计划

- Status: completed
- Date: 2026-04-01
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
5. 2026-03-31：`TK-468` 已切为当前执行前线；接下来在同一 sprint 内承接 `parallel analysis` fan-out 与 collaboration recap presenter semantics 分层。
6. 2026-03-31：`TK-468` 第一阶段 baseline 已启动并推送；当前已支持 `@planner @reviewer` 受治理 parallel analysis fan-out、`synthesisMode / invokedRoleIds / subagentCount` metadata 投影，以及 `collaboration_recap` 与 `command_recap` 的 transcript presenter 分层。
7. 2026-03-31：完成 `TK-468`；当前已把 explicit parallel fan-out 扩展到 `@architect @reviewer @verifier` 三角色试点，并完成 shared session truth、service event payload、transcript presenter 与 resume parity 的一致性回归，`sprint-003` 达成 completed truth。
8. 2026-03-31：完成 post-closeout conversational follow-up 修补；`session.main` 当前已允许 `你好 / hello` 等短寒暄直接进入 main-agent direct-answer seam，不再在 connect 之后仍被短输入 follow-up 拦截。
9. 2026-04-01：用户已批准 conversational follow-up technical solution，并已在同一 closeout surface 下正式写回 active module docs；`session.main` 现拥有 formalized `conversation-first chatability + risk-tiered skill handoff` 方向，后续实现继续由 project-035 follow-up sprint 承接。
