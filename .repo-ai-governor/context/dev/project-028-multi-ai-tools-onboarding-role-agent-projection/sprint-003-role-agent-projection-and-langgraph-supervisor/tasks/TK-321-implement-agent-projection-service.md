# TK-321 implement AgentProjectionService

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-003-role-agent-projection-and-langgraph-supervisor`

## 1. 任务目标

实现 `AgentProjectionService`，把 role / route / session / capability 投影成统一的 `AgentDescriptor`。

## 2. Depends On

1. `TK-316`
2. `TK-317`

## 3. 预期产物

1. `AgentProjectionService`
2. `AgentDescriptor` JSON 投影

## 4. 实施计划

1. 使用 `roleProfileId / routeKey / stageId / adaptersConfig / runtimeDebugOptions / executionContext` 作为输入。
2. 输出 `agentId / agentRole / primarySurface / fallbackSurfaces / capabilities / budgets / policies`。
3. 保证投影幂等、可序列化、可回放。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
