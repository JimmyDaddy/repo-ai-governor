# sprint-002-policy-tuning-and-surface-expansion 计划

- Status: completed
- Date: 2026-03-27
- Project: `project-022-memory-semantics-safety-and-consumer-hardening`

## 1. Sprint Goal

继续细化 `sensitivity / visibility` policy、扩展 adopter-facing consumer surface，并明确 `workspace/user` seam 是否进入最小实现窗口。

## 2. Task Package

1. `TK-260` sprint-002 激活与 sprint-001 closeout handoff（completed）
2. `TK-261` sensitivity visibility policy stratification 与 runtime-safe decision baseline（completed）
3. `TK-262` adopter-facing promotion output surface expansion 与 replay UX polish（completed）
4. `TK-263` workspace-user seam readiness assessment 与 implementation decision baseline（completed）
5. `TK-264` sprint-002 出口验收与 sprint-003 输入约束（completed）

## 3. Exit Criteria

1. `sensitivity / visibility` 至少形成分层 policy（如 warn/redact/block 的明确边界），而不只剩单一 redaction baseline。
2. adopter-facing consumer 至少再扩一条真实 surface，且不回退到 raw memory snapshot。
3. `workspace/user` seam 是否进入实现窗口已有明确决策与证据，而不是继续悬空。
4. project / sprint / task / artifact / delivery / master-plan 真值保持同步。

## 4. Execution Notes

1. `sprint-002` 默认消费 `DA-259`、`DA-257` 与 `DA-258`，不再回头重做 `sprint-001` 已完成的 baseline。
2. policy tuning 必须先于更广的 consumer 扩张，避免 adopter-facing 输出建立在不稳定治理语义上。
3. 若 `workspace/user` seam 仍不具备 substrate/ownership 条件，可输出明确 defer decision，而不是硬做伪实现。
4. 当前 sprint 已完成验收；在 `sprint-003` 显式激活前，`current-context.md` 可暂时保留本 sprint 作为 active closeout surface。
