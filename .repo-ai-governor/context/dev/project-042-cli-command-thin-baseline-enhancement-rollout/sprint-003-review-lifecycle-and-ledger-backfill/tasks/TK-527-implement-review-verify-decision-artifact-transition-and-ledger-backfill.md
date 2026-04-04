# TK-527 implement review-verify decision artifact transition and ledger backfill

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-003-review-lifecycle-and-ledger-backfill`

## 1. 任务目标

在 `TK-526` 的 review artifact truth 之上，为 `review-verify` 实现 verify decision、artifact status transition 与受控 ledger backfill，使 review 治理形成连续闭环。

## 2. Depends On

1. `TK-526`
2. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
3. `apps/cli/src/commands/review-verify-command.ts`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`

## 3. 预期产物

1. `review-verify` verify decision / accepted-rejected finding baseline
2. review artifact lifecycle transition 与 status synchronization
3. governed ledger backfill baseline

## 4. Required Inputs

1. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
2. `apps/cli/src/commands/review-verify-command.ts`
3. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/tasks/TK-526-implement-review-finding-generation-and-lifecycle-artifact-truth-baseline.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/plan.md`

## 6. 实施计划

1. 定义 `review-verify` decision contract、accepted/rejected finding 集合与 artifact status transition。
2. 约束 ledger backfill 只能作为 review truth 的派生投影。
3. 为 resolved closeout 与 retry/failure path 保留稳定 artifact linkage。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续进入代码实现阶段需补 review-verify lifecycle / ledger backfill 定向验证

## 8. Delivery Verification

1. 后续完成实现时必须补 `pnpm run build`
2. 后续完成实现时必须补 review lifecycle / ledger backfill 回归证据
3. 交付前需补齐 artifact transition 与 ledger projection 的真实落点

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 `review-verify` 决策迁移与 ledger backfill 实现。
2. 2026-04-04：完成 `review-verify` lifecycle 实现：accepted/rejected finding projection、verified/resolved artifact transition、queued/open/resolved request 状态、`not_requested/applied/failed` ledger backfill 投影与 service-backed summary/update 对齐。
3. 2026-04-04：完成验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/sync-task-ledger.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`。
4. 2026-04-04：根据 working-tree CR 同步将 `review-verify` 的 changed-path / artifact 路由切到 `workspace.repositoryRoot`，并保留 resolved no-op 请求默认不抢占未解决 review 的队列优先级回归覆盖。

## 10. 产出

1. `apps/cli/src/commands/review-verify-command.ts`
2. `apps/cli/src/constants/cli-governance-runtime.constant.ts`
3. `apps/cli/test/commands/review-verify-command.test.ts`
4. `apps/cli/test/cli-governance-runtime.integration.test.ts`
