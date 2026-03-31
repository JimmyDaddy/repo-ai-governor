# TK-472 introduce foreground skill registry and risk-tiered governed handoff

- Status: planned
- Date: 2026-04-01
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-005-conversational-chat-and-skill-handoff-productization`

## 1. 任务目标

为 `session.main` 引入 deterministic foreground skill registry，并把自然语言 skill 命中收敛到统一的 risk-tiered policy gate，使低风险 skill 能 `direct_execute`，高风险/高歧义 skill 保持 `preview_confirm`。

## 2. Depends On

1. `TK-471`

## 3. 预期产物

1. foreground skill registry baseline
2. `riskTier / sideEffectClass / executionCostClass / scopeResolution / confirmationMode` 等最小 skill metadata
3. `help`、`doctor`、`verify` 与 scope-aware `review` 的低风险直跑试点
4. `connect`、`run`、`review verify` 与多步 bundle 的 preview/confirm 治理边界

## 4. 验证

1. `pnpm run build`
2. skill-intent routing / risk-tiered handoff 相关 regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-04-01：任务创建，状态初始化为 `planned`；skill registry 首轮只接受 deterministic 单命令 skill 与明确的 risk gate，不引入开放式 planner。
