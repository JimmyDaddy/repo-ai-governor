# sprint-002-promotion-pipeline-and-runtime-consumer-rollout 计划

- Status: completed
- Date: 2026-03-27
- Project: `project-021-memory-semantics-runtime-implementation`

## 1. Sprint Goal

在不重写 canonical source ownership 的前提下，建立显式 memory promotion pipeline baseline，并将 `runtime.memory-semantics` 扩展到第二个 runtime consumer。

## 2. Task Package

1. `TK-247` sprint-002 激活与 sprint-001 closeout handoff（completed）
2. `TK-248` memory promotion pipeline 与 contract-safe summary baseline（completed）
3. `TK-249` second runtime consumer rollout 与 memory-context consumer cutover（completed）
4. `TK-250` sprint-002 出口验收与 sprint-003 输入约束（completed）

## 3. Exit Criteria

1. `current-context.md` 已切换到 `project-021 / sprint-002`，且 `sprint-001` 已迁入 completed history。
2. `runtime.memory-semantics` 已具备 audit-friendly 的显式 promotion pipeline baseline，且 machine-readable promotion summary 不回退到 raw snapshot shape。
3. 至少一个第二 runtime consumer 已通过 `memoryContext` 或 contract-safe summary 接入 `runtime.memory-semantics`。
4. `project / sprint / task / artifact` 真值保持同步，并已冻结 `sprint-003` 输入约束。

## 4. Execution Notes

1. `sprint-002` 默认消费 `DA-245` 与 `DA-244`，不再回到 formal docs/gate 扩张。
2. `core-memory` 继续作为 substrate manager；不得把 canonical source ownership 挪进 `runtime.memory-semantics`。
3. 新的 consumer 只能消费 `memoryContext` 或 contract-safe summary，不允许重新暴露 `layeredSnapshot`。
4. 第二 consumer 优先选择非当前 CLI task-driven path，确保 rollout 不是单点自消费。
5. 当前 sprint 已完成验收；在下一条主执行流显式激活前，`current-context.md` 可临时保留 `sprint-002` 作为 active closeout surface。
