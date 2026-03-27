# sprint-003-promotion-output-rollout-and-project-closeout 计划

- Status: completed
- Date: 2026-03-27
- Project: `project-021-memory-semantics-runtime-implementation`

## 1. Sprint Goal

将 promotion output / session summary 投影扩展到至少一个 reporting-facing consumer，并完成 `project-021` 的 completion closeout 准备与判定。

## 2. Task Package

1. `TK-251` sprint-003 激活与 sprint-002 closeout handoff（completed）
2. `TK-252` promotion output reporting consumer 与 session-summary projection baseline（completed）
3. `TK-253` project-021 completion audit 与 delivery closeout baseline（completed）
4. `TK-254` sprint-003 出口验收与 project-021 完成态收口（completed）

## 3. Exit Criteria

1. 至少一个 runtime/reporting consumer 已通过 `promotionSummary` 或 session-summary projection 消费 `runtime.memory-semantics` 输出，而不是读取底层 snapshot。
2. `technical-solution.memory-module` 的 delivery handoff、artifact ledger、project/sprint/task truth 与 current-context 保持同步，并形成 `project-021` completion audit 输入。
3. 已给出 `project-021` 的 completed / blocked closeout 结论；若为 completed，必须产出 project completion audit summary 与里程碑记录。

## 4. Execution Notes

1. `sprint-003` 默认消费 `DA-250`、`DA-248` 与 `DA-249`，不再扩 recall substrate 或 canonical source ownership。
2. 新 consumer 只能消费 `memoryContext`、contract-safe summary、`promotionSummary` 或 session-summary projection，不允许回退到 `layeredSnapshot`。
3. closeout 判断必须以 project completion audit、delivery registry、artifact registry、task ledger 与 `current-context` 真值一致为准。
4. 2026-03-27：`sprint-003` 已正式激活，`sprint-002` 已迁入 completed history。
5. 2026-03-27：`sprint-003` 已完成验收；`project-021` 已切换为 `completed`，`current-context` 暂保留本 sprint 作为 active closeout surface，等待下一条主执行流显式激活。
