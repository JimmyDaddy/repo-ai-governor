# TK-887 sprint-002 exit acceptance and sprint-003 activation handoff

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-002-distribution-and-runtime-service-enablement`

## 1. 任务目标

在 `sprint-002` 完成 implementation 与 activation-time local `CR-001` clean 后，完成 exit acceptance，并把边界交接给 `sprint-003`。

## 2. Depends On

1. `TK-885`
2. `TK-886`
3. activation-time local `CR-001` fresh reviewer loop

## 3. 预期产物

1. sprint-002 closeout notes
2. sprint-003 activation constraints
3. synced task ledger and sprint plan status write-back

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/plan.md`
2. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-003-clean-room-verify-support-truth-and-rollout-closeout/plan.md`
3. `.repo-ai-governor/context/current-context.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/plan.md`

## 6. 实施计划

1. 核对 `TK-885`、`TK-886` 与 activation-time local `CR-001` 是否已 clean 收口。
2. 将 sprint-002 closeout 与 sprint-003 activation boundary 写回 task ledger 与 sprint/project plan。
3. 在 sprint-002 clean 后将 `project-105 / sprint-003` 切为新的 active primary stream，并保持 `project-105` 继续处于执行中。

## 7. Development Verification

1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir ".repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/tasks"`
2. `node ./scripts/governance/sync-task-ledger.js --tasks-dir ".repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-003-clean-room-verify-support-truth-and-rollout-closeout/tasks"`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-15：`CR-001` 修复 round 与 `CR-002` clean recheck 已全部收口，当前 sprint-002 boundary 内无剩余 actionable finding。已完成 sprint-002 exit acceptance，并将 `sprint-003` 激活为新的 primary stream；`TK-888` 切换为 `in_progress`，下一步先在新 sprint 本地预留 `CR-001` 再开始 clean-room verify implementation。

## 10. 产出

1. sprint-002 closeout notes in `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-002-distribution-and-runtime-service-enablement/plan.md`
2. sprint-003 activation write-back in `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-003-clean-room-verify-support-truth-and-rollout-closeout/plan.md`
3. primary-stream switch in `.repo-ai-governor/context/current-context.md`
