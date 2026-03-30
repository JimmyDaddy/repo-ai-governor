# sprint-003-role-agent-projection-and-langgraph-supervisor 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`

## 1. Sprint Goal

落实 `AgentProjectionService`、`AgentSessionRegistry` 与 LangGraph supervisor 的 multi-agent 编排接线。

## 2. Task Package

1. `TK-321` 实现 AgentProjectionService。
2. `TK-322` 实现 AgentSessionRegistry。
3. `TK-323` 接入 LangGraph supervisor。

## 3. Exit Criteria

1. `@repo-ai-governor/core-agent-projection` 已提供 JSON 可序列化的 `AgentDescriptor` 投影与共享 session agent view。
2. `AgentSessionRegistry` 仅作为共享 session 的投影层，不引入新的 canonical session source。
3. LangGraph supervisor 规划器已能消费 agent descriptor，并把规划产物回链到 CLI/runtime artifacts。

## 4. Execution Notes

1. 2026-03-30：新增 `packages/core-agent-projection`，收口 `AgentProjectionService`、`AgentSessionRegistry` 与配套类型导出。
2. 2026-03-30：`packages/core-runtime-langgraph` 已新增 agent descriptor supervisor 接口与 planner，`run` 命令会写出 `context/diagnostics/run/agent-supervisor/*.json`。
3. 2026-03-30：shared session projection 保持只读投影语义；session 事实源仍属于既有 `SharedSessionManager` / orchestration runtime。
