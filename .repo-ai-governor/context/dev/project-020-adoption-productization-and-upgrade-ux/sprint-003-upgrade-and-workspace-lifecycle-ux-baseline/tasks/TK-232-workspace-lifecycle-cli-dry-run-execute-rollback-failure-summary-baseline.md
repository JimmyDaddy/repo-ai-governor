# TK-232 workspace lifecycle CLI dry-run/execute/rollback/failure-summary baseline

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline`

## 1. 任务目标

把 `WorkspaceMigrationService` 收敛为正式 CLI 用户路径，至少覆盖 dry-run、execute、rollback 与 failure summary。

## 2. Depends On

1. `TK-231`
2. `packages/config/src/workspace-migration-service.ts`
3. `packages/config/src/workspace-resolver.ts`

## 3. 预期产物

1. workspace lifecycle CLI 基线。
2. dry-run / execute / rollback / failure summary 输出契约。
3. 后续 `DA-232`

## 4. 实施计划

1. 复用既有 `plan/execute/rollback` service 语义，避免新增平行实现。
2. 设计 adopter-facing 的最小命令入口与输出 contract。
3. 补齐 failure summary、rollback reference 与验证覆盖。

## 5. 验证

1. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run check`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始把 `WorkspaceMigrationService` 接成正式 `workspace` CLI 命令，并补齐 dry-run / execute / rollback / failure summary contract。
3. 2026-03-26：已完成 workspace lifecycle CLI 基线，实现 `--workspace-action/--workspace-mode/--workspace-root/--workspace-plan`，并通过 command/runtime/output-contract 测试、`pnpm run test:integration` 与 `pnpm run check`。
