# TK-524 implement plan explicit commit and governed ledger projection

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-002-plan-breakdown-and-ledger-commit-productization`

## 1. 任务目标

在 `TK-523` 结构化 breakdown 的基础上，为 `plan` 引入 explicit commit 与 governed ledger projection，使任务分解能受控落入 checklist / tasks.csv / TK truth，而不是仅停留在分析结果。

## 2. Depends On

1. `TK-523`
2. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
3. `apps/cli/src/commands/plan-command.ts`
4. `packages/core-orchestration-service`

## 3. 预期产物

1. `plan` preview -> confirm -> commit baseline
2. governed ledger projection 与失败回退约束
3. 受控写入 checklist / tasks.csv / task card 的实现边界

## 4. Required Inputs

1. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
2. `apps/cli/src/commands/plan-command.ts`
3. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-002-plan-breakdown-and-ledger-commit-productization/tasks/TK-523-implement-structured-plan-breakdown-generation-and-preview-surface.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-002-plan-breakdown-and-ledger-commit-productization/plan.md`

## 6. 实施计划

1. 设计 `plan` explicit confirm / commit request contract 与 id linkage。
2. 约束 ledger projection 只能通过单写源链路落账。
3. 补齐 commit receipt / failure / retry 所需的治理边界。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续进入代码实现阶段需补 `plan` commit path 定向验证

## 8. Delivery Verification

1. 后续完成实现时必须补 `pnpm run build`
2. 后续完成实现时必须补 `plan` preview/confirm/commit 回归证据
3. 交付前需补齐 ledger projection 真实落点与失败回退说明

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 `plan` explicit commit 与 governed ledger projection 能力实现。
2. 2026-04-04：实现 `plan` explicit confirm / commit、preview target drift 校验、task card 生成、sprint plan reconcile、`sync-task-ledger.js` 调用与 commit receipt 产物，确保 ledger projection 继续遵循单写源链路。
3. 2026-04-04：完成定向验证：`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "plan|dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry"`、`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts -t "plan"`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`pnpm run build`。

## 10. 产出

1. `apps/cli/src/commands/plan-command.ts`
2. `apps/cli/src/constants/cli-command-result-check.constant.ts`
3. `examples/multi-role-collaboration-flow/scenario.json`
