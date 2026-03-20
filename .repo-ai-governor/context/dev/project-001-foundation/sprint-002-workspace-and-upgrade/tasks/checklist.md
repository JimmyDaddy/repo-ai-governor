# checklist

- [x] TK-009 Workspace Resolver 双模式基线
  - 2026-03-20: 完成 `WorkspaceResolver` 双模式解析基线与优先级定义，接线 CLI 运行上下文并通过 `pnpm run test`、`pnpm run build`、`pnpm run check`。
- [x] TK-010 workspace 迁移链路基线
  - 2026-03-20: 完成 `WorkspaceMigrationService` 的 `copy -> verify -> switch -> rollback` 链路与失败恢复语义，补齐 smoke 测试并通过 `pnpm run test`、`pnpm run build`、`pnpm run check`。
- [x] TK-011 upgrade schema diff 与迁移建议基线
  - 2026-03-20: 完成 `UpgradeSchemaDiffService` 与 v1.1 schema 校验扩展，产出 `schema diff -> 迁移建议 -> 人工确认` 基线并通过 `pnpm run test`、`pnpm run build`、`pnpm run check`。
- [x] TK-012 sprint-002 出口验收与回滚基线
  - 2026-03-20: 完成 sprint-002 出口验收、升级冲突处置与回滚基线沉淀，落地 Stage 2 输入就绪清单并通过 `pnpm run test`、`pnpm run build`、`pnpm run check`。
