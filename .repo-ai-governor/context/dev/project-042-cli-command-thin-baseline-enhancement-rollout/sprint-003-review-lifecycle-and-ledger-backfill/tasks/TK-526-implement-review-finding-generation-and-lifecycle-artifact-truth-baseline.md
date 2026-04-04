# TK-526 implement review finding generation and lifecycle artifact truth baseline

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-003-review-lifecycle-and-ledger-backfill`

## 1. 任务目标

把 `review` 从 queue-only baseline 提升为可生成结构化 findings 并写入正式 lifecycle artifact 的真实治理入口，确保 review truth 不再漂移到 transport artifact。

## 2. Depends On

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
2. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
3. `apps/cli/src/commands/review-command.ts`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`

## 3. 预期产物

1. `review` structured findings generation baseline
2. lifecycle artifact truth 与 queue artifact 降级边界
3. 为 `TK-527` 提供稳定的 finding / artifact 输入

## 4. Required Inputs

1. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
2. `apps/cli/src/commands/review-command.ts`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
4. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-002-cli-benchmark-and-borrowing-analysis/tasks/DA-519-cli-capability-maturity-analysis-promotion-cutover.md`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/plan.md`

## 6. 实施计划

1. 盘点 `review` 当前 queue artifact baseline 与 companion contract 的差异。
2. 冻结 finding 结构、artifact naming 与 lifecycle truth 边界。
3. 为 `review-verify` 后续消费提供稳定 artifact / finding linkage。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 当前为 docs-only decomposition；后续代码实现时再补 review path 定向验证

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续完成实现并切换为 `completed` 前，必须补 `pnpm run build` 与 `review` finding generation 回归证据

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 `review` finding generation 与 lifecycle artifact truth 基线补强。
2. 2026-04-04：任务切换为 `active`；`sprint-002 plan` 已完成 closeout，当前开始盘点 `review-command` / `review-verify-command` 现状与 review lifecycle companion contract 之间的真实缺口。
3. 2026-04-04：完成 `review` lifecycle baseline 实现：新增 structured finding generator、canonical review artifact / queue transport 分层、review scope active-stream 路由与 file-level git changed-path 采集，修复 untracked code path 被目录级 porcelain 输出吞掉的问题。
4. 2026-04-04：完成验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/sync-task-ledger.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`。
5. 2026-04-04：根据 working-tree CR 补修 `git status --porcelain` 普通未暂存路径截断，并把 active-stream repo-relative 路由统一绑定到 `workspace.repositoryRoot`，补齐 `review-command` 与 `plan` 的子目录调用回归覆盖。

## 10. 产出

1. `apps/cli/src/commands/review-command.ts`
2. `apps/cli/src/runtime/review/cli-review-lifecycle-runtime.ts`
3. `apps/cli/src/runtime/review/cli-review-finding-generator.ts`
4. `apps/cli/src/constants/cli-review.constant.ts`
5. `apps/cli/src/types/interfaces/cli-review-command.interface.ts`
6. `apps/cli/test/commands/review-command.test.ts`
7. `apps/cli/src/commands/plan-command.ts`
8. `apps/cli/test/cli-governance-runtime.integration.test.ts`
