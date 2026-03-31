# sprint-003-intent-routing-and-command-handoff 计划

- Status: completed
- Date: 2026-03-31
- Project: `project-033-session-main-agent-runtime-productization`
- Sprint Goal: 为主 agent 接入 session-level routing preference、adapter-surface selection semantics 与 richer command handoff metadata。

## 1. Task Package

1. `TK-455` integrate session.main with adapter routing and session-level routing preference
2. `TK-456` emit command-intent suggestion handoff metadata and transcript backlinks

## 2. Exit Criteria

1. `session.main` 能正式消费 `sessionRoutingPreference` 并反映到 `selectedSurface / selectedBy / handoff preview`。
2. transcript presenter 能显示 routing selection，而不是只显示 suggestion/preview。
3. command-intent / handoff metadata 继续向 artifact backlinks 和 richer downstream consumer 语义推进。
4. build 与 targeted tests 覆盖 routing preference path。

## 3. Milestones

1. 2026-03-31：创建 `sprint-003` planning surface，并将 `TK-455 ~ TK-456` 写入 task package。
2. 2026-03-31：完成 `TK-455`，让 `session.main` 吃进 session-level routing preference，并将 adapter-surface selection metadata 渲染到 transcript。
3. 2026-03-31：完成 `TK-456`，将 `handoffBacklinks` 结构化 metadata 写入 completed payload，并让 transcript 展示 backlink lines。
4. 2026-03-31：完成 working-tree CR 修复，恢复 plain completed turn 的兼容式 echo recap，并修复 failure/cancel 之后 `turnIndex` 仍需单调递增的 canonical session numbering 语义。
