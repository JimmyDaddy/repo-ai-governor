# sprint-001-recall-context-assembly-baseline 计划

- Status: active
- Date: 2026-03-27
- Project: `project-021-memory-semantics-runtime-implementation`

## 1. Sprint Goal

建立 technical solution delivery handoff baseline，并实现 `runtime.memory-semantics` 的首个 recall/context assembly 运行时路径。

## 2. Task Package

1. `TK-242` project-021 激活与 memory-module delivery handoff bootstrap（completed）
2. `TK-243` technical-solution delivery registry 与 execution handoff gate baseline（completed）
3. `TK-244` core-memory-semantics package 与 CLI task-driven runtime baseline（in_progress）
4. `TK-245` sprint-001 出口验收与 sprint-002 输入约束（planned）
5. `TK-246` technical-solution consumer surfaces 与 rollout ownership 扩展（completed）

## 3. Exit Criteria

1. `current-context.md` 已切换到 `project-021 / sprint-001`，且 `project-018 / sprint-005` 已迁入 completed history。
2. `technical-solution-delivery-registry.yaml`、对应 contract、promotion skill 与 blocking gate 已正式落地。
3. `technical-solution-delivery-registry.yaml` 已扩展到 consumer surfaces、user impact 与 rollout ownership。
4. `packages/core-memory-semantics` baseline 已建立，并开始承接 recall/context assembly contract。
5. CLI task-driven runtime 的 memory path 已切到新的 semantics service baseline，相关 tests 进入验证面。

## 4. Execution Notes

1. 这轮优先做 bounded-context baseline，不在同一窗口里重写 memory canonical source。
2. delivery handoff gate 是这轮 bootstrap 的一部分，因为 `runtime.memory-semantics` 正好暴露了 promotion -> execution 的断点。
