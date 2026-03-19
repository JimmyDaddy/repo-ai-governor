# TK-010 workspace 迁移链路基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-001-foundation`
- Sprint: `sprint-002-workspace-and-upgrade`

## 1. 任务目标

建立 `copy/verify/switch/rollback` 迁移链路基线与失败恢复策略。

## 2. Depends On

1. `TK-009`
2. `DA-014`
3. `DA-012`
4. `DA-013`
5. `DA-003`

## 3. 预期产物

1. `DA-015` workspace migration baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-009-workspace-resolver-dual-mode-baseline.md` (`DA-014`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-001-exit-acceptance-baseline.md` (`DA-012`)
3. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-002-input-constraints-checklist.md` (`DA-013`)
4. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)

## 5. 实施摘要

1. 在 `packages/config` 落地 `WorkspaceMigrationService`：
   - 提供 `plan()` 统一构建迁移计划（source/target/staging/backup）。
   - 提供 `execute()` 执行 `copy -> verify -> switch` 链路并在 switch 失败时自动尝试 rollback。
   - 提供 `rollback()` 恢复 target 侧快照，形成失败恢复基线。
2. 固化迁移步骤契约：
   - 新增 `WorkspaceMigrationStep`、`WorkspaceMigrationStepStatus` 常量枚举。
   - 新增迁移接口类型：`WorkspaceMigrationOptions`、`WorkspaceMigrationPlan`、`WorkspaceMigrationStepResult`、`WorkspaceMigrationExecutionResult`。
3. 补齐验证用例：
   - 新增 `workspace-migration-service.smoke.test.ts`，覆盖成功迁移链路与 rollback 恢复路径。
4. 更新配置包文档：
   - `packages/config/README.md` 新增 migration API 与执行语义说明，明确 rollback 边界。

## 6. 产出

1. `packages/config/src/workspace-migration-service.ts`
2. `packages/config/src/constants/workspace-migration.constant.ts`
3. `packages/config/src/types/interfaces/workspace-migration-options.interface.ts`
4. `packages/config/src/types/interfaces/workspace-migration-plan.interface.ts`
5. `packages/config/src/types/interfaces/workspace-migration-step-result.interface.ts`
6. `packages/config/src/types/interfaces/workspace-migration-execution-result.interface.ts`
7. `packages/config/src/index.ts`
8. `packages/config/src/constants/index.ts`
9. `packages/config/src/types/interfaces/index.ts`
10. `packages/shared/src/errors/error-code.constant.ts`
11. `test/workspace-migration-service.smoke.test.ts`
12. `packages/config/README.md`
13. `DA-015` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-010-workspace-migration-chain-baseline.md`

## 7. 验证

1. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run check`
