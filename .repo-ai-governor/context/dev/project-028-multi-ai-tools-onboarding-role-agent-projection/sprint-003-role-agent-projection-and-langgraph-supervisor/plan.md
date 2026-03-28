# sprint-003-role-agent-projection-and-langgraph-supervisor 计划

- Status: planned
- Date: 2026-03-28
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`

## 1. Sprint Goal

落实 `AgentProjectionService`、`AgentSessionRegistry` 与 LangGraph supervisor 的 multi-agent 编排接线。

## 2. Task Package

1. `TK-321` 实现 AgentProjectionService。
2. `TK-322` 实现 AgentSessionRegistry。
3. `TK-323` 接入 LangGraph supervisor。

## 3. Exit Criteria

1. `AgentProjectionService` 能把 role / route / surface 投影为 JSON 可序列化的 `AgentDescriptor`。
2. `AgentSessionRegistry` 仅作为共享 session 的投影层，不引入新的 canonical session source。
3. LangGraph supervisor 能消费 agent descriptor 并保持与现有 `AgentRouteRunner` 语义一致。

## 4. Execution Notes

1. 投影层与编排层必须保持职责分离，不能把 supervisor 写成第二套 runtime。
2. session registry 必须以现有共享 session 为事实源，不可并行造源。
