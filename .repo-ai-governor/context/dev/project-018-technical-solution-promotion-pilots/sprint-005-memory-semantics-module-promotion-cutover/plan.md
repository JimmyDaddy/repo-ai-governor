# sprint-005-memory-semantics-module-promotion-cutover 计划

- Status: completed
- Date: 2026-03-27
- Project: `project-018-technical-solution-promotion-pilots`

## 1. Sprint Goal

引入 `runtime.memory-semantics` formal module skeleton，并将 `technical-solution.memory-module` 从 draft 切换为 lifecycle-managed final solution。

## 2. Task Package

1. `TK-238` sprint-005 激活与 project-018 reopen handoff（completed）
2. `TK-239` runtime.memory-semantics 正式模块 skeleton 与 contract baseline（completed）
3. `TK-240` memory-module technical solution lifecycle、module-registry 与 manifest promotion cutover（completed）
4. `TK-241` sprint-005 出口验收与 project-018 re-closeout（completed）

## 3. Exit Criteria

1. `project-018` 已从 `project-020` closeout surface 切换到 `sprint-005`，并将 `project-020 / sprint-004` 迁入 completed history。
2. `runtime.memory-semantics` 的 module overview、2 份 contract 与 1 份 ADR 已正式落地。
3. `technical-solution.memory-module` 已具备 review evidence、final paths、target module realignment 与 activation metadata，并切换到 `active`。
4. promotion 所需 lifecycle/module/manifest/task/review/artifact gates 已全部通过。

## 4. Completion Notes

1. 这次 cutover 新增的是 memory semantics 模块边界，而不是继续把 recall/promotion 语义塞回 `runtime.memory-provider-loading`。
2. `runtime.orchestration` 继续作为 runtime owner，消费 memory semantics 的 context assembly contract，但不直接承担 memory policy。
3. `runtime.memory-semantics` 只 formalize working-state boundary、recall policy、context assembly 与 promotion pipeline，不伪造“memory 已接管 canonical source”的错误语义。
