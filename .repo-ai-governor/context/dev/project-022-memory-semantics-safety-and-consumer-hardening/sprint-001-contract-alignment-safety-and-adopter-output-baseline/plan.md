# sprint-001-contract-alignment-safety-and-adopter-output-baseline 计划

- Status: completed
- Date: 2026-03-27
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`

## 1. Sprint Goal

收敛 `workspace/user` 预留层 contract truth、assembly sensitivity enforcement 与 adopter-facing promotion output baseline。

## 2. Task Package

1. `TK-255` project-022 激活与 project-021 closeout handoff（completed）
2. `TK-256` workspace-user layer contract 对齐与 future capability 降级（completed）
3. `TK-257` sensitivity visibility assembly enforcement baseline（completed）
4. `TK-258` adopter-facing promotion output 与 replay diagnostics baseline（completed）
5. `TK-259` sprint-001 出口验收与 sprint-002 输入约束（completed）

## 3. Exit Criteria

1. `workspace/user` 预留层的 contract truth 与当前实现边界一致。
2. context assembly 已具备最小可执行的 sensitivity / visibility enforcement。
3. 至少一个 adopter-facing consumer 已消费 contract-safe promotion output 或 replay diagnostics。
4. project / sprint / task / artifact / delivery / master-plan 真值保持同步。

## 4. Execution Notes

1. `sprint-001` 默认消费 `DA-254` 与 `project-021` completion audit，不再重做 recall/context assembly 主链。
2. contract 收缩与 safety hardening 优先于新增 consumer 数量，避免 surface 扩张建立在失真的 contract 之上。
3. adopter-facing consumer 优先选择 CLI 现有 replay/report diagnostics 相邻 surface，而不是额外新建独立 UI。
4. 当前 sprint 已完成验收；在 `sprint-002` 显式激活前，`current-context.md` 可暂时保留本 sprint 作为 active closeout surface。
