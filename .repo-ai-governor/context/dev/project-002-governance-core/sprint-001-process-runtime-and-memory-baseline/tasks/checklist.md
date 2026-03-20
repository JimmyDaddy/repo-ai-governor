# checklist

- [x] TK-013 Process DSL 与 Compiler IR v1 基线
  - 2026-03-20: 完成 `packages/core-process` 基线搭建，落地 Process DSL 与 Compiler IR v1 契约、IR 版本兼容校验与 `compiled-ir` 快照持久化，并通过 `pnpm run test`、`pnpm run build`、`pnpm run check`。
  - 2026-03-20: 完成 CR 复核修复，补齐快照 `snake_case` 持久化契约与 `nodeType` 显式校验，并通过 `pnpm run typecheck`、`pnpm run test`、`pnpm run check`。
- [ ] TK-014 Runtime 控制流执行基线
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始实现 `core-runtime` 控制流引擎基线与中断语义。
  - 2026-03-20: 已处理 review 评论，完成运行时常量数字风格收敛（去除 `_` 分隔符）与时钟 provider 类化扩展（`RuntimeNowProvider` + `DefaultRuntimeNowProvider`），并通过 `pnpm run typecheck`、`pnpm run test -- process-runtime-engine.smoke.test.ts`、`pnpm run check`。
  - 2026-03-20: 已完成 TK-014 CR 复核并将报告推进为 `verified_review_tk-014-runtime-control-flow-engine-baseline.md`，复核结论“部分认可”，确认无阻断项，并通过 `pnpm run typecheck`、`pnpm run test -- process-runtime-engine.smoke.test.ts`、`pnpm run check`。
- [ ] TK-015 Memory/Session/Store 基线
- [ ] TK-016 sprint-001 出口验收基线
