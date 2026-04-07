# checklist

- [x] TK-618 freeze standards runtime loader product path and source-layering contract
  - 2026-04-06：任务创建，等待 `project-056` 激活。
  - 2026-04-07：`project-056` 已切换为当前 primary stream，开始收口 runtime loader 的 source-layering contract 与 product consumption path。
  - 2026-04-07：新增 `StandardsRuntimeLoader.renderConfiguredTargets()` 与 `StandardsRuntimeRenderInput`，把 `renderTargets` 从 README 示例提升为正式 runtime helper；同窗口通过 `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts` 与 `pnpm run build`。
- [x] TK-619 implement and document standards runtime consumption examples plus team-pack path
  - 2026-04-06：任务创建，等待 `TK-618` 完成。
  - 2026-04-07：新增 `team-runtime-pack.fixture.ts`、三层 `official / team / repository` integration coverage，以及 README/config README 的统一 product consumption story；同窗口通过 `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts` 与 `pnpm run build`。
- [x] TK-620 decide AGENTS projector adoption boundary and close standards runtime productization baseline
  - 2026-04-06：任务创建，等待 `TK-618 / TK-619` 完成。
  - 2026-04-07：通过 runtime integration test 与 README 文案明确 `projectAgents()` 只返回 caller-owned projection payload，不自动写回仓库根 `AGENTS.md`；同窗口通过 `pnpm exec vitest run --config vitest.packages.config.ts packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts` 与 `pnpm run build`。
- [x] CR-001 sprint-001-standards-runtime-loader-product-path delegated review loop round 1
  - 2026-04-07：任务创建，状态初始化为 `review_pending`。
  - 2026-04-07：fresh reviewer 报告 1 条 actionable finding；主 agent 复核后认可 relative projection target 未按 `baseDirectory` 解析的问题，并将本轮推进到 `verified`。
  - 2026-04-07：accepted finding 已修复；重跑 targeted vitest、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`cwd != baseDirectory` dist repro 与 `pnpm run check` 后，本轮收口为 `resolved`。
- [x] TK-650 sprint-001 exit acceptance and project-final review activation handoff
  - 2026-04-07：在 `TK-618`、`TK-619`、`TK-620` 与 `CR-001` 全部进入终态后创建本任务。
  - 2026-04-07：已写入 `DA-650`、project/sprint plan closeout handoff 与 task-ledger 同步；当前 sprint surface 保留给后续 `project-final` CR loop。
