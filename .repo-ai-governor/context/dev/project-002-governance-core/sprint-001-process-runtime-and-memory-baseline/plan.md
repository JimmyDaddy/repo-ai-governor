# sprint-001-process-runtime-and-memory-baseline 计划

- Status: active
- Date: 2026-03-20
- Project: `project-002-governance-core`

## 1. Sprint Goal

完成 Stage 2 最小治理闭环：Compiler IR、Runtime 控制流、Memory/Session/Store 基线。

## 2. In-Scope Tasks

1. TK-013 Process DSL 与 Compiler IR v1 基线
2. TK-014 Runtime 控制流执行基线
3. TK-015 Memory/Session/Store 基线
4. TK-016 sprint-001 出口验收基线

## 3. Entry Criteria

1. `DA-018` 与 `DA-019` 已可检索并可作为输入约束基线。
2. `pnpm run check` 在 project-001 收尾后稳定通过。

## 4. Exit Criteria

1. `compiled-ir/<execution_id>.json` 落盘契约形成并可被 Runtime 消费。
2. Runtime 至少覆盖四类节点与中断/超时基础处理语义。
3. Memory/Session/Store 基线具备快照读写与最小回放能力。
4. sprint-001 产出验收基线与 sprint-002 输入约束清单。
