# TK-523 implement structured plan breakdown generation and preview surface

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-002-plan-breakdown-and-ledger-commit-productization`

## 1. 任务目标

将 `plan` 的前半链路收口为结构化 breakdown generation + preview surface，使 runtime 能先给出可审阅的任务拆解结果，再决定是否提交到正式台账。

## 2. Depends On

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
2. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
3. `apps/cli/src/commands/plan-command.ts`
4. `packages/core-orchestration-service`

## 3. 预期产物

1. `plan` structured breakdown request/result baseline
2. preview-only presenter-safe output contract
3. 为 `TK-524` 提供稳定的 breakdown artifact 与 commit 前置输入

## 4. Required Inputs

1. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
2. `apps/cli/src/commands/plan-command.ts`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
4. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-002-cli-benchmark-and-borrowing-analysis/tasks/DA-519-cli-capability-maturity-analysis-promotion-cutover.md`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-002-plan-breakdown-and-ledger-commit-productization/plan.md`

## 6. 实施计划

1. 盘点 `plan` 当前 snapshot artifact baseline 与 companion contract 的缺口。
2. 定义 structured breakdown 的 request/result 与 preview-only 输出边界。
3. 为 `TK-524` 的 explicit commit 提供稳定 artifact / request linkage。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 当前为 docs-only decomposition；后续代码实现时再补命令级定向回归

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续完成实现并切换为 `completed` 前，必须补 `pnpm run build` 与 `plan` preview path 回归证据

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 `plan` structured breakdown 与 preview surface 基线补强。
2. 2026-04-04：任务切换为 `active`；`project-042` primary stream 已切换到 `sprint-002`，开始对读 `plan-command`、`session.main` capability catalog 与 companion contract，收敛 structured preview 边界。
3. 2026-04-04：实现 `plan` structured breakdown preview、active stream 解析、preview artifact 与 create/retain task package 投影，为 explicit commit 与 presenter rendering 提供稳定输入。
4. 2026-04-04：完成定向验证：`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "plan|dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry"`、`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts -t "plan"`、`pnpm exec vitest run test/e2e/blackbox-governance-flow.e2e.test.ts -t "plan -> run -> review -> review-verify -> replay"`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`pnpm run build`。

## 10. 产出

1. `apps/cli/src/commands/plan-command.ts`
2. `apps/cli/src/constants/cli-plan.constant.ts`
3. `apps/cli/src/types/interfaces/cli-plan-command.interface.ts`
