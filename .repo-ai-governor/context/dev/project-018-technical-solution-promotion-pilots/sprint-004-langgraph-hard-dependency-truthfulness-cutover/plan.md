# sprint-004-langgraph-hard-dependency-truthfulness-cutover 计划

- Status: completed
- Date: 2026-03-26
- Project: `project-018-technical-solution-promotion-pilots`

## 1. Sprint Goal

将 `core-runtime-langgraph` 从 `optional peer + binding seam` 收敛为 direct dependency baseline，并同步 bundled vendor contract verification 的 truthfulness 口径。

## 2. Task Package

1. `TK-210` sprint-004 激活与 project-018 reopen handoff（completed）
2. `TK-211` core-runtime-langgraph 直连依赖切换与 vendor binding contract 对齐（completed）
3. `TK-212` LangGraph package truthfulness 文档与 rollout 约束同步（completed）
4. `TK-213` sprint-004 出口验收与 project-018 re-closeout（completed）

## 3. Exit Criteria

1. `project-018` 已从 sprint-003 closeout surface 切换到 sprint-004，并将 sprint-003 迁入 completed history。
2. `packages/core-runtime-langgraph/package.json` 与 `pnpm-lock.yaml` 已将 `@langchain/langgraph` 收敛为 direct dependency。
3. `LangGraphCommunityVendorBinding`、相关类型、测试与 README 已从 optional peer 语义切换到 bundled dependency contract verification。
4. 代码验证与 governance gates 已全部通过。

## 4. Completion Notes

1. 这次 cutover 只解决 package/runtime truthfulness 与依赖声明的偏移，不伪造“官方 LangGraph execution 内核已完全接管”。
2. `core-runtime-langgraph` 现在默认随包分发社区 `@langchain/langgraph`，但 primary execution 仍然是仓库自有 graph-first backend。
3. sprint-004 已完成验收，`project-018` 再次收口为 completed。
