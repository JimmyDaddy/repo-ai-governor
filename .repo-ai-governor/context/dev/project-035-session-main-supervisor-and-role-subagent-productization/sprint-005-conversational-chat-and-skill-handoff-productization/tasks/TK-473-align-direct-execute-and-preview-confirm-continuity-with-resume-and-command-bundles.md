# TK-473 align direct-execute and preview-confirm continuity with resume and command bundles

- Status: completed
- Date: 2026-04-01
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-005-conversational-chat-and-skill-handoff-productization`

## 1. 任务目标

让 `session.main` 的 `preview_confirm` 与 `direct_execute` 两类 skill continuity 在 transcript / shared session truth / `/clear` / `resume` 中保持一致，并为小型 command bundle 提供可恢复的 preview/execute 语义。

## 2. Depends On

1. `TK-472`

## 3. 预期产物

1. `preview_confirm` pending handoff 与 `direct_execute` executed-state 的统一 shared-session 投影
2. `/clear`、`resume` 与 transcript presenter 的 continuity parity
3. 小型 command bundle 的 preview / confirm / stop-on-failure baseline
4. help/review/direct-execute 与 command-bundle 相关 regression coverage

## 4. 验证

1. `pnpm run build`
2. resume / transcript / command-bundle continuity 相关 regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-04-01：任务创建，状态初始化为 `planned`；先保证 direct-execute 与 preview-confirm 的恢复链不分叉，再考虑 richer bundle auto-execute 或更复杂 planner graph。
2. 2026-04-01：任务切换为 `active`；已开始把 natural-language handoff 元数据写回 shared session truth，并统一 `/confirm`、`/cancel`、`/resume` 与 transcript presenter 的恢复来源。
3. 2026-04-01：任务完成；`direct_execute` 与 `preview_confirm` 现已共享 canonical pending-handoff continuity，`connect -> verify` 这类小型 command bundle 支持 preview、resume、单次确认后顺序执行与 stop-on-failure。
4. 2026-04-01：已完成 sprint-005 working-tree CR 接受项修补；startup、显式 `/resume` 与 `/clear` 恢复 unresolved `direct_execute` handoff 时，现会按原始 execution mode 自动继续执行，不再错误降级为 `/confirm` preview。
