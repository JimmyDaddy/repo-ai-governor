# TK-231 upgrade command user path 与 confirmation/rollback reference baseline

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline`

## 1. 任务目标

将 `upgrade` 命令从“仅输出 schema diff artifact”收敛为 adopter 可理解、可操作的 CLI 用户路径，至少明确 schema diff、migration suggestions、confirmation items 与 rollback reference。

## 2. Depends On

1. `TK-230`
2. `DA-229`
3. `apps/cli/src/commands/upgrade-command.ts`
4. `packages/config/src/upgrade-schema-diff-service.ts`
5. `packages/standards/src/standards-upgrade-planner.ts`

## 3. 预期产物

1. `upgrade` CLI 用户路径基线实现。
2. 面向 adopter 的 confirmation / rollback reference 输出契约。
3. 后续 `DA-231`

## 4. 实施计划

1. 盘点 `CliUpgradeCommand` 当前只输出 artifact 的缺口，并冻结 adopter-facing 最小输出契约。
2. 将 `UpgradeSchemaDiffService` 与相关 planner 能力收敛为统一 CLI 输出，而不是要求用户手工打开 JSON artifact。
3. 补齐最小验证与文档/台账回链。

## 5. 验证

1. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run check`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始盘点 `CliUpgradeCommand`、`UpgradeSchemaDiffService` 与相关 planner 能力的 adopter-facing 缺口。
3. 2026-03-26：已完成 upgrade adopter-facing CLI 收口，新增 report / auto-migrated-config / rollback snapshot artifacts、confirmation prompts，并通过 `tsc`、目标 vitest、`pnpm run test:integration` 与 `pnpm run check`。
