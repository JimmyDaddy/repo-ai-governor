# sprint-001-vendor-adapter-and-sidecar-baseline 计划

- Status: completed
- Date: 2026-03-26
- Project: `project-016-langgraph-runtime-productization`

## 1. Sprint Goal

为 LangGraph full productization 冻结第一轮正式实现边界：vendor adapter、graph-first execution、`sidecar + ipc` host 与 desktop execution/service ops。

## 2. Task Package

1. `TK-161` project-016 启动与 LangGraph runtime productization 重排（completed）
2. `TK-162` 社区 LangGraph vendor adapter 与 package truthfulness 基线（completed）
3. `TK-163` graph-first execution semantics 与 selector/cutover hardening（completed）
4. `TK-164` `sidecar + ipc` orchestration host 与 transport 基线（completed）
5. `TK-165` desktop execution surface 与 service ops/release baseline（completed）
6. `TK-166` sprint-001 出口验收与后续 rollout 输入约束（completed）

## 3. Exit Criteria

1. `DA-160` 与 `DA-161` 已被 project-016 的后续任务正式消费。
2. LangGraph vendor/runtime truthfulness、graph-first engine、sidecar host 与 desktop execution 的任务边界已冻结。
3. sprint-001 的 bootstrap/implementation/acceptance 路径具备可执行台账。
