# sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline 计划

- Status: completed
- Date: 2026-03-27
- Project: `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`

## 1. Sprint Goal

收敛 workspace artifact locality target-root contract、rollback scratch cleanup 与 adopter-facing truthfulness baseline。

## 2. Task Package

1. `TK-270` project-023 激活与 project-022 closeout handoff（completed）
2. `TK-271` workspace artifact locality contract 与 target-root decision baseline（completed）
3. `TK-272` workspace artifact locality execute rollback cutover 与 CLI truthfulness（completed）
4. `TK-273` rollback scratch cleanup 与 residual-state semantics hardening（completed）
5. `TK-274` sprint-001 出口验收与 project-023 完成态评估（completed）

## 3. Exit Criteria

1. workspace migration 的 artifact locality 已形成明确的 canonical contract，而不是继续停留在 source `tool_managed` 侧的隐式行为。
2. rollback 后的 scratch 目录清理语义已收敛为自动 cleanup 或显式、可验证的残留策略，而不是留给用户猜测。
3. CLI 输出、文档与定向验证链路已与新的 locality/cleanup 真值保持一致。
4. 当前 sprint 的 task ledger、review 生命周期与后续输入冻结保持一致。

## 4. Execution Notes

1. `sprint-001` 默认消费 `project-020` 的 adopter pilot gap register 与 completion audit，不再回头重做 packaged distribution 或 upgrade 路径的已完成 baseline。
2. artifact locality contract 应优先回答“adopter 在 repo_local 模式下去哪里找 plan/execution/rollback 产物”，而不是仅回答内部实现如何存放文件。
3. scratch cleanup 修复必须保持 rollback 行为可恢复、可审计；若需要保留残留目录，必须让其语义对用户显式可见。
4. 2026-03-27：`sprint-001` 已正式激活，`project-022 / sprint-003` 已迁入 completed history。
5. 2026-03-27：`sprint-001` 已完成验收；`project-023` 已切换为 `completed`，`current-context` 暂保留本 sprint 作为 active closeout surface，等待下一条主执行流显式激活。
