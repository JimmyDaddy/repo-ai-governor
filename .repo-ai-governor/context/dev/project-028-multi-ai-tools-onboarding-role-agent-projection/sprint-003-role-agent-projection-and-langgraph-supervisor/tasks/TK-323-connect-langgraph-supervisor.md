# TK-323 connect LangGraph supervisor

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-003-role-agent-projection-and-langgraph-supervisor`

## 1. 任务目标

接入 LangGraph supervisor，让 graph-first runtime 能消费 agent descriptor 并编排多 agent 节点。

## 2. Depends On

1. `TK-321`
2. `TK-322`

## 3. 预期产物

1. LangGraph supervisor 接线
2. 多 agent 节点调度语义

## 4. 实施计划

1. 将 supervisor 定义为 `core-runtime-langgraph` 的 multi-agent 用法扩展。
2. 保持 supervisor 只负责图怎么跑，不改写谁来执行的治理语义。
3. 确保执行仍能通过 `AgentRouteRunner` 与现有 contract 回写审计。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已在 `packages/core-runtime-langgraph` 中接入 agent descriptor supervisor planner，并由 `run` 命令输出 LangGraph supervisor diagnostics artifact。
