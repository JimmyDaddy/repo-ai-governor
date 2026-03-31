# TK-466 productize role-subagent collaboration and command handoff governance baseline

- Status: planned
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-002-answer-supervisor-and-role-subagent-bootstrap`

## 1. 任务目标

在 `session.main` supervisor bootstrap 之上补齐 single-role subagent path 与 command handoff governance baseline，让 connected roles 开始具备前台可协作的最小 runtime 语义。

## 2. Depends On

1. `TK-465`

## 3. 预期产物

1. `AgentDescriptor -> SessionMainSubagentDescriptor` 最小派生 seam
2. 一条可工作的 `session.main.role.<role-id>` 试点 path
3. `invokedRoleIds[] / subagentCount / interactionMode` 等最小协作 metadata
4. natural-language command handoff 的 preview + confirm governance baseline

## 4. 验证

1. `pnpm run build`
2. role-subagent / handoff 相关 regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`；第一阶段优先选择 single-role delegate 试点，不强行一次性交付 full multi-agent fan-out。
