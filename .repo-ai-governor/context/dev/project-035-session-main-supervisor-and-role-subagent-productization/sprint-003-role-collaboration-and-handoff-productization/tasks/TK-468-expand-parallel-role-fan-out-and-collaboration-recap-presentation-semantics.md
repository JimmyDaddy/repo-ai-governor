# TK-468 expand parallel role fan-out and collaboration recap presentation semantics

- Status: active
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-003-role-collaboration-and-handoff-productization`

## 1. 任务目标

在 serial collaboration 稳定后，为 `session.main` 引入受控的 parallel role fan-out，并让 collaboration recap / handoff recap 的 transcript 呈现语义保持可读且可区分。

## 2. Depends On

1. `TK-467`

## 3. 预期产物

1. 至少一条 `parallel analysis` fan-out path
2. `subagentCount / synthesisMode / invokedRoleIds[]` 等并行协作 metadata
3. collaboration recap 与 command handoff recap 的 presenter 语义分层
4. parallel collaboration 相关 regression coverage

## 4. 验证

1. `pnpm run build`
2. parallel collaboration / recap presenter 相关 regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`；parallel fan-out 第一阶段只面向分析/建议类场景，不直接放开高副作用执行。
2. 2026-03-31：任务切换为 `active`；当前先收敛一条受治理的 `parallel analysis` path，并把 collaboration recap 与 command handoff recap 的 presenter 语义显式分层。
