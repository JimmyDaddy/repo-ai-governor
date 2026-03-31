# checklist

- [x] TK-467 stabilize serial role collaboration and interaction-mode routing
  - 2026-03-31：任务创建，状态初始化为 `planned`；承接 `session.main` 从 single-role delegate 走向 serial collaboration 的 Phase B 起点。
  - 2026-03-31：`sprint-003` 已激活，`TK-467` 切换为 `active`；当前先收敛一条 `planner -> reviewer` 风格的串行协作路径，并稳定 interaction-mode routing / metadata 投影。
  - 2026-03-31：已完成 `@planner @reviewer` 串行协作基线、`routerDecisionReason` 投影与 serial collaboration parity 回归；后续 `TK-468` 承接 parallel fan-out 与 collaboration recap presenter 分层。

- [x] TK-468 expand parallel role fan-out and collaboration recap presentation semantics
  - 2026-03-31：任务创建，状态初始化为 `planned`；在 serial collaboration 后补 parallel analysis 与 collaboration recap presenter 分层。
  - 2026-03-31：`TK-468` 已切换为 `active`；当前先收敛一条受治理的 parallel analysis path，并让 collaboration recap 与 command handoff recap 的 transcript 语义显式区分。
  - 2026-03-31：已完成第一阶段启动并推送 baseline；`@planner @reviewer` explicit-role parallel fan-out、`synthesisMode / invokedRoleIds / subagentCount` metadata 与 `collaboration_recap` presenter 已落地，完整仓库 gate `pnpm run check` 通过。
  - 2026-03-31：已完成三角色 parallel fan-out 试点；explicit `@architect @reviewer @verifier parallel ...` 现可并行分析并保持 shared-session/resume/presenter 一致性，`pnpm run build` 与 `pnpm run check` 已通过。
  - 2026-03-31：已完成 CR 接受项修补；当显式 role mentions 超出当前 pilot 上限时，runtime 现在会 fail closed 并提示 overflow，不再静默丢弃多余角色。
  - 2026-03-31：已完成会话寒暄 follow-up 修补；`你好 / hello` 等短寒暄现可直接进入 main-agent answer seam，不再被 `session.main.follow_up` 截停。
  - 2026-04-01：已完成 approved conversational follow-up technical solution promotion；formal docs 现正式接受 risk-tiered natural-language skill handoff、`help` 直跑与 scope-aware `review` 直跑回退方向，相关 lifecycle / delivery / review / DA-468 / artifact evidence 已同步。
