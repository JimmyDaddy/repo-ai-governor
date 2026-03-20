# checklist

- [x] TK-013 Process DSL 与 Compiler IR v1 基线
  - 2026-03-20: 完成 `packages/core-process` 基线搭建，落地 Process DSL 与 Compiler IR v1 契约、IR 版本兼容校验与 `compiled-ir` 快照持久化，并通过 `pnpm run test`、`pnpm run build`、`pnpm run check`。
  - 2026-03-20: 完成 CR 复核修复，补齐快照 `snake_case` 持久化契约与 `nodeType` 显式校验，并通过 `pnpm run typecheck`、`pnpm run test`、`pnpm run check`。
- [ ] TK-014 Runtime 控制流执行基线
- [ ] TK-015 Memory/Session/Store 基线
- [ ] TK-016 sprint-001 出口验收基线
