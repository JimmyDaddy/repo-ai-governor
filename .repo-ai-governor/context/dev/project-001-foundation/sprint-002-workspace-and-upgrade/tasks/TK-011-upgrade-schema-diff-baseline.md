# TK-011 upgrade schema diff 与迁移建议基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-001-foundation`
- Sprint: `sprint-002-workspace-and-upgrade`

## 1. 任务目标

建立 upgrade 的 `schema diff -> 自动迁移建议 -> 人工确认` 基线流程。

## 2. Depends On

1. `TK-010`
2. `DA-014`
3. `DA-003`
4. `DA-005`
5. `DA-006`
6. `DA-008`
7. `DA-013`
8. `DA-015`

## 3. 预期产物

1. `DA-016` upgrade diff baseline 文档。
2. `DA-017` 人工确认策略约束说明。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-010-workspace-migration-chain-baseline.md` (`DA-015`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-009-workspace-resolver-dual-mode-baseline.md` (`DA-014`)
3. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)
4. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-config-contract-baseline.md` (`DA-005`)
5. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-i18n-community-solution-comparison-and-repo-decision.md` (`DA-006`)
6. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-shared-i18n-runtime-baseline.md` (`DA-008`)
7. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-002-input-constraints-checklist.md` (`DA-013`)

## 5. 实施摘要

1. 在 `packages/config` 新增 `UpgradeSchemaDiffService`：
   - 输出标准化 `schema diff`、`迁移建议`、`人工确认决策`。
   - 形成 `autoMigratedConfig` 草案，支持后续升级命令串接。
2. 建立 schema version 与升级策略常量基线：
   - 新增 `GovernorSchemaVersion` 与 `Upgrade*` 枚举集合。
   - 固化当前升级路径支持：`1.0 -> 1.1`。
3. 扩展配置 schema 校验到 v1.1：
   - `SchemaValidator` 增加 `schemaVersion` 支持集校验。
   - `workspace.migrationPolicy` 在 `schemaVersion: 1.1` 下改为必填，值域由 `WorkspaceMigrationPolicy` 统一约束。
4. 补齐 smoke 测试：
   - 新增 `test/upgrade-schema-diff-service.smoke.test.ts`，覆盖：
     - `1.0 -> 1.1` diff 与 auto-apply 建议；
     - 已是最新 schema 的 allow 决策；
     - 不支持升级路径的标准化错误输出。
5. 更新配置包文档：
   - `packages/config/README.md` 增补 upgrade schema diff API 与 v1.1 校验约束。

## 6. 产出

1. `packages/config/src/upgrade-schema-diff-service.ts`
2. `packages/config/src/constants/schema-upgrade.constant.ts`
3. `packages/shared/src/constants/workspace-migration-policy.constant.ts`
4. `packages/config/src/schema-validator.ts`
5. `packages/config/src/types/interfaces/workspace-config.interface.ts`
6. `packages/config/src/types/interfaces/upgrade-schema-diff-options.interface.ts`
7. `packages/config/src/types/interfaces/upgrade-schema-diff-item.interface.ts`
8. `packages/config/src/types/interfaces/upgrade-migration-suggestion.interface.ts`
9. `packages/config/src/types/interfaces/upgrade-confirmation-item.interface.ts`
10. `packages/config/src/types/interfaces/upgrade-schema-diff-result.interface.ts`
11. `packages/config/src/index.ts`
12. `packages/config/src/constants/index.ts`
13. `packages/config/src/types/interfaces/index.ts`
14. `packages/shared/src/constants/index.ts`
15. `packages/shared/src/index.ts`
16. `packages/shared/src/errors/error-code.constant.ts`
17. `test/upgrade-schema-diff-service.smoke.test.ts`
18. `packages/config/README.md`
19. `DA-016` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-011-upgrade-schema-diff-baseline.md`
20. `DA-017` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-011-upgrade-human-confirmation-policy-baseline.md`

## 7. 验证

1. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run check`
