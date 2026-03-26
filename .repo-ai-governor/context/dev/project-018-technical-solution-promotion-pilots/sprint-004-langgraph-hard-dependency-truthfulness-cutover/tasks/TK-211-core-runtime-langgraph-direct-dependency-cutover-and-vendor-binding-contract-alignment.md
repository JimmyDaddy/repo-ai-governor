# TK-211 core-runtime-langgraph 直连依赖切换与 vendor binding contract 对齐

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-018-technical-solution-promotion-pilots`
- Sprint: `sprint-004-langgraph-hard-dependency-truthfulness-cutover`

## 1. 任务目标

将 `core-runtime-langgraph` 从 `optional peer` 收敛为 direct dependency，并同步 `LangGraphCommunityVendorBinding` 的 contract 语义。

## 2. Depends On

1. `TK-210`

## 3. Required Inputs

1. `packages/core-runtime-langgraph/package.json`
2. `pnpm-lock.yaml`
3. `packages/core-runtime-langgraph/src/langgraph-community-vendor-binding.ts`
4. `packages/core-runtime-langgraph/src/types/interfaces/langgraph-vendor-binding.interface.ts`
5. `packages/core-runtime-langgraph/test/langgraph-community-vendor-binding.unit.test.ts`

## 4. 预期产物

1. 更新后的 `package.json`
2. 更新后的 `pnpm-lock.yaml`
3. 更新后的 vendor binding 类型 / 实现 / 单测
4. `DA-211`

## 5. 实施计划

1. 将 `@langchain/langgraph` 改成 direct dependency，并确保 lockfile 跟随更新。
2. 将 `binding resolution` 从 `isOptionalPeerDependency` 语义收敛为 bundled dependency contract verification。
3. 保留 `module_missing` 的 fail-closed 诊断，但只把它视为异常安装/分发损坏路径。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-runtime-langgraph/test/langgraph-community-vendor-binding.unit.test.ts --maxWorkers=1 --maxConcurrency=1`

## 7. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始执行 dependency cutover 并调整 binding contract。
3. 2026-03-26：已完成 package.json/pnpm-lock、binding contract 与测试语义对齐，形成 `DA-211`。
