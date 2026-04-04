# TK-522 add upgrade rollback execution path interactive shell presenter and regression acceptance

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-001-upgrade-controlled-apply-and-rollback`

## 1. 任务目标

为 `upgrade` 补齐 rollback execution path、interactive shell presenter 与 regression acceptance，使 sprint-001 能以完整的受控升级闭环收口，而不是只完成 apply 半链路。

## 2. Depends On

1. `TK-520`
2. `TK-521`
3. `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`

## 3. 预期产物

1. rollback path 与 rollback receipt baseline
2. interactive shell 对 confirm/apply/rollback 的统一 presenter 语义
3. sprint-001 exit acceptance 与 regression evidence

## 4. Required Inputs

1. `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
3. `apps/cli/src/commands/upgrade-command.ts`
4. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-001-upgrade-controlled-apply-and-rollback/tasks/TK-521-implement-upgrade-explicit-confirm-controlled-apply-and-verify-receipts.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-001-upgrade-controlled-apply-and-rollback/plan.md`
3. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-002-cli-benchmark-and-borrowing-analysis/tasks/DA-519-cli-capability-maturity-analysis-promotion-cutover.md`

## 6. 实施计划

1. 为 verify_failed / user_reject / rolled_back 等分支补齐 rollback 路径。
2. 对 interactive shell 的 confirmation/result/hint 呈现做收口。
3. 增加定向回归与 sprint-001 closeout evidence。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 代码实现阶段需补 `pnpm run build`、`upgrade` rollback regression 与必要 review；当前拆解阶段 not required

## 8. Delivery Verification

1. 后续完成实现时必须补 `pnpm run build`
2. 后续完成实现时必须补 `upgrade` rollback / presenter regression evidence
3. sprint-001 收口前需补齐 review artifact 与 acceptance 回链

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 `upgrade` rollback / presenter / regression acceptance 收口。
2. 2026-04-04：已补齐 `upgrade rollback` execution path、rollback/verify receipt、React shell / pretty output / i18n explainability，以及 preview/apply/rollback 定向回归与 build evidence。

## 10. 产出

1. 已完成：`upgrade rollback` 对 apply receipt / rollback snapshot 的恢复路径与 `*.rollback-receipt.json` baseline。
2. 已完成：interactive shell、pretty output、人类可读 message 与 i18n key 对齐到 preview/apply/rollback 语义。
3. 已完成：`pnpm run build`、`vitest upgrade` 定向集成回归与 `check-i18n-parity-fallback` 证据。
