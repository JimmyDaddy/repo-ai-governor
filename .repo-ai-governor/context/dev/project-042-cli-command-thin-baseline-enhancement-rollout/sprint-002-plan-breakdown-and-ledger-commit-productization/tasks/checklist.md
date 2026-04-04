# checklist

- [x] TK-523 implement structured plan breakdown generation and preview surface
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `plan` structured breakdown 与 preview surface 基线补强。
  - 2026-04-04：任务切换为 `active`；`project-042` primary stream 已切换到 `sprint-002`，开始对读 `plan-command`、`session.main` capability catalog 与 companion contract，收敛 structured preview 边界。
  - 2026-04-04：实现 `plan` structured breakdown preview、active stream 解析、preview artifact 与 create/retain task package 投影，为 explicit commit 与 presenter rendering 提供稳定输入。
  - 2026-04-04：完成定向验证：`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "plan|dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry"`、`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts -t "plan"`、`pnpm exec vitest run test/e2e/blackbox-governance-flow.e2e.test.ts -t "plan -> run -> review -> review-verify -> replay"`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`pnpm run build`。
- [x] TK-524 implement plan explicit commit and governed ledger projection
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `plan` explicit commit 与 governed ledger projection 能力实现。
  - 2026-04-04：实现 `plan` explicit confirm / commit、preview target drift 校验、task card 生成、sprint plan reconcile、`sync-task-ledger.js` 调用与 commit receipt 产物，确保 ledger projection 继续遵循单写源链路。
  - 2026-04-04：完成定向验证：`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "plan|dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry"`、`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts -t "plan"`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`pnpm run build`。
- [x] TK-525 align plan cli explainability i18n and regression acceptance
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `plan` explainability / i18n / regression acceptance 收口。
  - 2026-04-04：补齐 `plan` presenter label/detail humanizer、CLI help appendix、`confirm-plan` i18n、runtime/output/e2e/example 测试与 example baseline，对齐 `plan_preview` / `plan_commit` 的用户可见契约。
  - 2026-04-04：完成定向验证：`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts -t "plan"`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/examples/check-examples-smoke.js`、`node ./scripts/examples/check-examples-runtime.js`、`pnpm run build`。
