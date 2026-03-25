# sprint-001-runtime-adoption-and-migration-baseline 计划

- Status: active
- Date: 2026-03-25
- Project: `project-014-langgraph-orchestration-runtime-adoption`

## 1. Sprint Goal

冻结 LangGraph runtime adoption 决策、runtime adapter 边界、shared local orchestration service 目标形态，以及 Phase 0/1 的迁移验收口径。

## 2. Task Bundle

1. `TK-142` LangGraph 采用决策并入 triad/master plan 与 project-014 启动
2. `TK-143` Process Runtime -> LangGraph adapter 边界与 state contract 基线
3. `TK-144` shared local orchestration service（CLI + desktop）契约基线
4. `TK-145` LangGraph Phase 0 spike、dual-runtime parity 与 rollout 迁移计划
5. `TK-146` sprint-001 出口验收与 sprint-002 输入约束

## 3. Entry Criteria

1. `TK-142` 与 `DA-142` 已将 `LangGraph` 采用决策正式并入 triad/master plan/artifact registry。
2. `project-013` 已完成远端 provider 真实调用与 adapter operations 收口，并形成 completion audit summary。
3. `project-011` 与 `project-012` 的工程边界和治理基线已形成正式 handoff。

## 4. Exit Criteria

1. triad/brief/master plan/current-context/projects overview/dev index 已完成 `LangGraph` runtime adoption 决策同步。
2. `Process Runtime -> LangGraph` 边界、state contract 与 canonical source 约束具备正式基线。
3. `shared local orchestration service` 的 CLI/desktop 共用接口与 ownership 约束具备正式基线。
4. Phase 0 spike、dual-runtime parity、checkpointer 路径与 sprint-002 输入约束具备正式文档与任务拆解入口。

## 5. Risks

1. 若把业务逻辑直接写进 `LangGraph` 节点，后续 runtime backend 替换成本会快速上升。
2. 若 `desktop client` 直接持有 runtime 状态，会破坏 CLI 与桌面端的单一执行面假设。
3. 若 checkpointer 与 workspace canonical source 边界不清，会重新引入第二套状态源。
