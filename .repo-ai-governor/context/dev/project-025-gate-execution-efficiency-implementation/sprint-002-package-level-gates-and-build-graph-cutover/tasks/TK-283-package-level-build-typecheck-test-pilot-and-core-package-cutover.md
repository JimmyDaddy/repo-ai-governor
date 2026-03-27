# TK-283 package-level build typecheck test pilot 与 core package cutover

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-025-gate-execution-efficiency-implementation`
- Sprint: `sprint-002-package-level-gates-and-build-graph-cutover`

## 1. 任务目标

将核心 package 的 `build / typecheck / test:unit` 下沉到 package-level，并完成首个 core package pilot cutover。

## 2. Depends On

1. `TK-281`
2. `TK-282`
3. `apps/cli/package.json`
4. `packages/core-memory-semantics/package.json`
5. `packages/reporting/package.json`

## 3. 预期产物

1. 至少一个核心 package 的 package-level `build / typecheck / test` 脚本。
2. 明确的 pilot 范围与 cutover 记录。
3. 与根级 `check` 兼容的下沉方案。

## 4. 实施计划

1. 盘点核心 package 候选，并选择首个 pilot。
2. 将候选 package 的 `build / typecheck / test` 脚本下沉到 package-level。
3. 验证根级 gate 与 package-level 执行入口的兼容性。

## 5. 验证结果（2026-03-28）

```bash
pnpm --dir packages/core-memory-semantics run typecheck
pnpm --dir packages/core-memory-semantics run test
pnpm --dir packages/core-memory-semantics run build
pnpm run check:fast
```

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始盘点 package-level pilot 候选、脚本下沉边界与 core package cutover 输入。
3. 2026-03-28：选择 `packages/core-memory-semantics` 作为首个 core package pilot，新增 package-level `build / typecheck / test` 入口与局部 tsconfig。
4. 2026-03-28：扩展 `scripts/build/copy-runtime-assets.js` 支持按 package 定向镜像，避免局部 build 误触发全量 distribution flow。
5. 2026-03-28：验证通过并完成首个 core package pilot cutover，状态切换为 `completed`。
6. 2026-03-28：完成 `code_review_working-tree-20260328` 中 finding `2.2` 的 CR 修复，改为基于 resolved package Set 差集判断未知 `--package` 目标，并补充定向验证。
