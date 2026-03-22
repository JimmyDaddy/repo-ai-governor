# TK-009 Workspace Resolver 双模式基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-001-foundation`
- Sprint: `sprint-002-workspace-and-upgrade`

## 1. 任务目标

建立 `tool_managed/repo_local` 双模式解析基线，并定义解析优先级。

## 2. Depends On

1. `TK-008`
2. `DA-003`
3. `DA-005`
4. `DA-006`
5. `DA-008`
6. `DA-010`
7. `DA-012`
8. `DA-013`

## 3. 预期产物

1. `DA-014` workspace resolver baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-config-contract-baseline.md` (`DA-005`)
3. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-005-i18n-community-solution-comparison-and-repo-decision.md` (`DA-006`)
4. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-shared-i18n-runtime-baseline.md` (`DA-008`)
5. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-warning-gate-baseline.md` (`DA-010`)
6. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-001-exit-acceptance-baseline.md` (`DA-012`)
7. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-002-input-constraints-checklist.md` (`DA-013`)

## 5. 实施摘要

1. 在 `packages/config` 新增 `WorkspaceResolver` 基线：
   - 统一输出 `workspaceId`、`mode`、`modeSource`、`repositoryRoot`、`workspaceRoot`、`configPath`。
   - 固化解析优先级：`runtimeOverrides > config.workspace > default(tool_managed)`。
2. 在 `packages/config` 增补 Workspace Resolver 契约：
   - 新增 resolver constants 与 interfaces（`ResolvedWorkspace`、`WorkspaceRuntimeOverrides`、`WorkspaceResolverOptions`）。
   - 更新 `packages/config/src/index.ts` 对外导出 `WorkspaceResolver` 与 `WorkspaceModeSource`。
3. 在 `apps/cli` 接线 Workspace Resolver：
   - 运行时上下文新增 workspace 解析结果。
   - skeleton 输出新增 workspace 关键信息，便于后续 TK-010/TK-011 消费同一解析事实。
4. 完成基础验证：
   - 新增 `test/workspace-resolver.smoke.test.ts` 覆盖 default/config/runtime 三类优先级场景。
   - 更新 CLI smoke 断言，确保输出中包含 workspace 解析结果。

## 6. 产出

1. `packages/config/src/workspace-resolver.ts`
2. `packages/config/src/constants/workspace-resolver.constant.ts`
3. `packages/config/src/constants/index.ts`
4. `packages/config/src/types/interfaces/workspace-runtime-overrides.interface.ts`
5. `packages/config/src/types/interfaces/workspace-resolver-options.interface.ts`
6. `packages/config/src/types/interfaces/resolved-workspace.interface.ts`
7. `apps/cli/src/main.ts`
8. `packages/shared/src/i18n/locales/en-us.ts`
9. `packages/shared/src/i18n/locales/zh-cn.ts`
10. `test/workspace-resolver.smoke.test.ts`
11. `test/cli-skeleton.smoke.test.ts`
12. `packages/config/README.md`
13. `DA-014` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-009-workspace-resolver-dual-mode-baseline.md`

## 7. 验证

1. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run check`
