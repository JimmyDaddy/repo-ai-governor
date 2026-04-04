# TK-525 align plan cli explainability i18n and regression acceptance

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-002-plan-breakdown-and-ledger-commit-productization`

## 1. 任务目标

收口 `plan` 的 CLI explainability、i18n 呈现与回归验收，确保 sprint-002 最终交付的是“可解释、可确认、可验证”的正式命令能力，而不是内部契约已完成但交互层仍割裂。

## 2. Depends On

1. `TK-523`
2. `TK-524`
3. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
4. `apps/cli/src/commands/plan-command.ts`

## 3. 预期产物

1. `plan` preview / confirm / commit presenter explainability baseline
2. i18n key / localized copy 对齐
3. sprint-002 regression acceptance 与 closeout evidence

## 4. Required Inputs

1. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
2. `apps/cli/src/commands/plan-command.ts`
3. `packages/shared/src/i18n/locales/en-us.ts`
4. `packages/shared/src/i18n/locales/zh-cn.ts`
5. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-002-plan-breakdown-and-ledger-commit-productization/tasks/TK-524-implement-plan-explicit-commit-and-governed-ledger-projection.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-002-plan-breakdown-and-ledger-commit-productization/plan.md`

## 6. 实施计划

1. 收口 `plan` preview/confirm/commit 的用户可见语义与 explainability。
2. 将 user-facing 文案统一接入 i18n。
3. 增加 sprint-002 所需的 presenter / regression acceptance evidence。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续进入代码实现阶段需补 `check-i18n-parity-fallback` 与命令级回归

## 8. Delivery Verification

1. 后续完成实现时必须补 `pnpm run build`
2. 后续完成实现时必须补 `node ./scripts/governance/check-i18n-parity-fallback.js`
3. 后续完成实现时必须补 `plan` CLI presenter / regression acceptance 证据

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 `plan` explainability / i18n / regression acceptance 收口。
2. 2026-04-04：补齐 `plan` presenter label/detail humanizer、CLI help appendix、`confirm-plan` i18n、runtime/output/e2e/example 测试与 example baseline，对齐 `plan_preview` / `plan_commit` 的用户可见契约。
3. 2026-04-04：完成定向验证：`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts -t "plan"`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/examples/check-examples-smoke.js`、`node ./scripts/examples/check-examples-runtime.js`、`pnpm run build`。

## 10. 产出

1. `apps/cli/src/cli-output-presenter.ts`
2. `packages/shared/src/i18n/locales/en-us.ts`
3. `packages/shared/src/i18n/locales/zh-cn.ts`
4. `apps/cli/test/cli-output-contract.integration.test.ts`
