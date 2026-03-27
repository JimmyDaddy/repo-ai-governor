# TK-284 turbo package graph 与 cache policy cutover

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-025-gate-execution-efficiency-implementation`
- Sprint: `sprint-002-package-level-gates-and-build-graph-cutover`

## 1. 任务目标

让 Turbo 真正消费 workspace package graph 与 cache policy，并避免 package-level cutover 后出现伪缓存命中。

## 2. Depends On

1. `TK-283`
2. `turbo.json`
3. `tsconfig.build.json`

## 3. 预期产物

1. 更新后的 `turbo.json` package graph 配置。
2. 与 package-level outputs 对齐的 cache policy。
3. 明确的 build outputs / package boundaries 约束。

## 4. 实施计划

1. 基于 `TK-283` 的 pilot 结果调整 Turbo package graph。
2. 收敛 cache policy 与 build outputs 口径。
3. 验证 package graph execution 的真实命中路径。

## 5. 验证结果（2026-03-28）

```bash
pnpm run check:package-local:pilot
pnpm run check:package-local:pilot
pnpm run check:fast
pnpm run check
```

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始基于 `core-memory-semantics` pilot 收敛 Turbo package graph 与 cache policy cutover 方案。
3. 2026-03-28：为 `shared -> memory-store-adapter -> core-memory -> core-memory-semantics` 依赖链补齐 package-level `build / typecheck / test` 入口与局部 tsconfig，确保 Turbo 可以沿真实 workspace package graph 运行 pilot。
4. 2026-03-28：在 `turbo.json` 中新增 package task 的 `build / typecheck / test` cache policy，并新增根级 `check:package-local:pilot` 入口，收敛 build outputs 到 package-local `dist/**`。
5. 2026-03-28：连续两次执行 `pnpm run check:package-local:pilot`，确认首轮真实执行、次轮 `12/12 cached` 命中，且 `check:fast` / `check` 保持兼容通过。
6. 2026-03-28：状态切换为 `completed`，Turbo package graph 与 cache policy pilot cutover 完成。
7. 2026-03-28：完成 `code_review_working-tree-20260328` 中 finding `2.4` 的 CR 修复，提升 repo-global gate JSON 失败输出的 `stderr` 预览长度，并新增回归测试验证诊断上下文保留。
