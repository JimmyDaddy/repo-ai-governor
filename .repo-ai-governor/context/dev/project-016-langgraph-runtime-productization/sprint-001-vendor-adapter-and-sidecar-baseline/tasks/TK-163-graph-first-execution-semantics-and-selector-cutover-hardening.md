# TK-163 graph-first execution semantics 与 selector/cutover hardening

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-016-langgraph-runtime-productization`
- Sprint: `sprint-001-vendor-adapter-and-sidecar-baseline`

## 1. 任务目标

把当前 LangGraph skeleton / migration selector 收敛成正式 graph-first execution semantics，并减少迁移期 comparison scaffolding。

## 2. Depends On

1. `TK-161`
2. `TK-162`
3. `DA-143`
4. `DA-145`
5. `DA-148`
6. `DA-160`
7. `DA-162`

## 3. 预期产物

1. graph-first execution semantics baseline。
2. selector / parity hardening 与 residual migration scaffolding 收敛策略。

## 4. 实施结果

1. `ProcessRuntimeFacade` 已在 `langgraph` 被选为 primary backend 时真实调用 `LangGraphRuntimeBackend.execute(...)`，不再落回 legacy runtime engine。
2. `LangGraphRuntimeBackend` 已从 prepare-only shell 扩展为 graph-first dispatch baseline，能够执行 `invoke_stage / branch / loop / fan_out` 四类基础 graph behavior，并返回正式 stage/execution 结果。
3. facade 已补齐与现有 runtime contract 的兼容桥：
   - `roleRegistry` 解析继续向 stage handler 暴露 `roleProfileVersion / roleSource`
   - `conditionResolver / loopController / nowProvider / stageInputs / signal` 已可透传到 LangGraph backend
   - LangGraph execution result 已映射回现有 `RuntimeExecutionResult`
4. selector/parity truthfulness 已补强：
   - `langgraph` primary path 的单测不再只验证“选择了 langgraph”，而是显式断言不会调用 legacy engine
   - `core-runtime-langgraph` 已新增 graph-first execute 单测
   - 旧的 terminal status 漂移已收敛为 `timeout`，不再保留不真实的 `interrupted` 表达
