# checklist

- [x] TK-009 Workspace Resolver 双模式基线
  - 2026-03-20: 完成 `WorkspaceResolver` 双模式解析基线与优先级定义，接线 CLI 运行上下文并通过 `pnpm run test`、`pnpm run build`、`pnpm run check`。
- [x] TK-010 workspace 迁移链路基线
  - 2026-03-20: 完成 `WorkspaceMigrationService` 的 `copy -> verify -> switch -> rollback` 链路与失败恢复语义，补齐 smoke 测试并通过 `pnpm run test`、`pnpm run build`、`pnpm run check`。
- [ ] TK-011 upgrade schema diff 与迁移建议基线
- [ ] TK-012 sprint-002 出口验收与回滚基线
