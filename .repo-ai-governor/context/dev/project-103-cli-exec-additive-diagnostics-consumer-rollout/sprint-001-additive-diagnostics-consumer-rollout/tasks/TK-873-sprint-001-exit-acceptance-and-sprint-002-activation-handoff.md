# TK-873 sprint-001 exit acceptance and sprint-002 activation handoff

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-103-cli-exec-additive-diagnostics-consumer-rollout`
- Sprint: `sprint-001-additive-diagnostics-consumer-rollout`

## 1. 任务目标

在 `sprint-001` 完成 implementation 与 activation-time local `CR-001` clean 后，完成 exit acceptance，并把边界交接给 `sprint-002`。

## 2. Depends On

1. `TK-858`
2. `TK-872`
3. activation-time local `CR-001` fresh reviewer loop

## 3. 预期产物

1. sprint-001 closeout notes
2. sprint-002 activation constraints
3. synced task ledger and sprint plan status write-back

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-001-additive-diagnostics-consumer-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/plan.md`
3. `.repo-ai-governor/context/current-context.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`

## 6. 实施计划

1. 核对 `TK-858`、`TK-872` 与 activation-time local `CR-001` 是否已 clean 收口。
2. 将 sprint-001 closeout 与 sprint-002 activation boundary 写回 task ledger 与 sprint/project plan。
3. 保持 `project-103` 仍为 planned stream，除非用户显式要求激活执行。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run build`
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
6. `pnpm run check`

## 8. Delivery Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-code-review-status-sync.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：`TK-858`、`TK-872`、`CR-001` 与 `CR-002` 已全部 clean 收口；当前已将 `sprint-001` 标记为 `completed`，并把 `sprint-002` 激活为新的 primary execution surface。
3. 2026-04-14：`TK-874` 已切换为 `in_progress` 作为 `sprint-002` implementation 入口；下一步在 active sprint surface 预留本地 `CR-001` 后进入 consumer adoption rollout。

## 10. 产出

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-001-additive-diagnostics-consumer-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/plan.md`
5. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/tasks/TK-874-adopt-launch-diagnostics-across-connect-doctor-verify-and-report-surfaces-and-retire-stderr-guess-branches.md`
