# TK-162 社区 LangGraph vendor adapter 与 package truthfulness 基线

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-016-langgraph-runtime-productization`
- Sprint: `sprint-001-vendor-adapter-and-sidecar-baseline`

## 1. 任务目标

明确 `core-runtime-langgraph` 与真实社区 LangGraph vendor runtime 的关系，完成 package truthfulness 与 vendor adapter 路线的正式基线。

## 2. Depends On

1. `TK-161`
2. `DA-160`

## 3. 预期产物

1. 社区 LangGraph vendor adoption / rename decision baseline。
2. package truthfulness 与 runtime boundary 约束。

## 4. 实施结果

1. `core-runtime-langgraph` 已新增 `LangGraphCommunityVendorBinding`，通过可选 peer + dynamic loader seam 探测社区 `@langchain/langgraph`，不再把 vendor adoption 假定为已完成。
2. `package.json` 已显式声明 `@langchain/langgraph` 为 optional peer dependency，并将 peer range 对齐当前稳定 `1.x` 版本线；README 已同步成 “backend shell + optional community vendor binding seam” 口径。
3. `TK-163/TK-164/TK-165` 后续将消费 `DA-162`，分别推进 graph-first engine、`sidecar + ipc` host 与 desktop/service ops。
