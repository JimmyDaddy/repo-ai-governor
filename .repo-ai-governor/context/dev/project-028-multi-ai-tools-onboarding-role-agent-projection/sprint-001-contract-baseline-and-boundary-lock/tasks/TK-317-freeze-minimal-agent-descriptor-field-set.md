# TK-317 freeze minimal agent descriptor field set

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-001-contract-baseline-and-boundary-lock`

## 1. 任务目标

冻结 `AgentDescriptor` 的最小字段集，并明确它与 `AgentSessionRegistry`、`Shared Session Manager`、`LangGraph supervisor` 的关系。

## 2. Depends On

1. `TK-316`

## 3. 预期产物

1. `runtime.agent-projection/contracts/agent-projection-contract.md`
2. `DA-316`

## 4. 实施计划

1. 以 projection-only 为前提收敛字段，不引入新的 session source。
2. 明确 `execution_id / session_id / selected_by` 的投影语义。
3. 保持 descriptor 可序列化、可回放、可幂等比较。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
