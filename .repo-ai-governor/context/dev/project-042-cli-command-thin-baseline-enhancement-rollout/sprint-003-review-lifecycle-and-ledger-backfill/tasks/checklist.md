# checklist

- [x] TK-526 implement review finding generation and lifecycle artifact truth baseline
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `review` finding generation 与 lifecycle artifact truth 基线补强。
  - 2026-04-04：任务切换为 `active`；`sprint-002 plan` 已完成 closeout，当前开始盘点 `review-command` / `review-verify-command` 现状与 review lifecycle companion contract 之间的真实缺口。
  - 2026-04-04：完成 `review` lifecycle baseline 实现：新增 structured finding generator、canonical review artifact / queue transport 分层、review scope active-stream 路由与 file-level git changed-path 采集，修复 untracked code path 被目录级 porcelain 输出吞掉的问题。
  - 2026-04-04：完成验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/sync-task-ledger.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`。
- [x] TK-527 implement review-verify decision artifact transition and ledger backfill
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `review-verify` 决策迁移与 ledger backfill 实现。
  - 2026-04-04：完成 `review-verify` lifecycle 实现：accepted/rejected finding projection、verified/resolved artifact transition、queued/open/resolved request 状态、`not_requested/applied/failed` ledger backfill 投影与 service-backed summary/update 对齐。
  - 2026-04-04：完成验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/sync-task-ledger.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`。
- [x] TK-528 add review lifecycle i18n rendering regression coverage and project closeout acceptance
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `review` lifecycle i18n / regression / project closeout acceptance 收口。
  - 2026-04-04：同步 `review` / `review-verify` runtime integration 旧断言到 canonical artifact-first contract，补齐 review closeout artifact、delivery registry handoff 与 project-042 completion audit summary。
  - 2026-04-04：完成交付验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`。
