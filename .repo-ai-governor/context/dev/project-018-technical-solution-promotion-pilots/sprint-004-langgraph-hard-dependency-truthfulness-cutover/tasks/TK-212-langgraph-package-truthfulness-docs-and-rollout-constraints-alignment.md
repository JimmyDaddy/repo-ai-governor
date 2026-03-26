# TK-212 LangGraph package truthfulness 文档与 rollout 约束同步

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-018-technical-solution-promotion-pilots`
- Sprint: `sprint-004-langgraph-hard-dependency-truthfulness-cutover`

## 1. 任务目标

同步 `core-runtime-langgraph` README 和当前 closeout surface 对 package truthfulness 的描述，使 direct dependency 语义不再和旧的 optional peer 口径冲突。

## 2. Depends On

1. `TK-211`
2. `DA-211`

## 3. Required Inputs

1. `packages/core-runtime-langgraph/README.md`
2. `project-016-langgraph-runtime-productization-completion-audit-summary.md`

## 4. 预期产物

1. 更新后的 `packages/core-runtime-langgraph/README.md`
2. 更新后的 sprint/project 说明与 closeout 口径
3. `DA-212`

## 5. 实施计划

1. 将 README 从 `optional peer + binding seam` 切换到 `direct dependency + bundled contract verification`。
2. 明确 direct dependency 不等于“官方 vendor execution 内核已完全接管”，避免新的 truthfulness 偏移。
3. 将 sprint-004 的结论沉淀为新的 rollout 约束，而不是回写历史 `project-016` 产物。

## 6. 验证

1. `rg -n "direct dependency|Bundled community vendor package|repo-owned graph-first backend|bundled contract verification" packages/core-runtime-langgraph/README.md packages/core-runtime-langgraph/package.json packages/core-runtime-langgraph/src/langgraph-community-vendor-binding.ts`

## 7. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始同步 README 与当前 truthfulness/rollout 约束。
3. 2026-03-26：已完成 README 与 sprint-004 closeout 口径对齐，形成 `DA-212`。
