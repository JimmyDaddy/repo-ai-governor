# TK-745 sprint-003 closeout and sprint-004 activation handoff

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-003-review-workflow-and-verify-removal`

## 1. 任务目标

完成 `sprint-003-review-workflow-and-verify-removal` closeout，并将 `project-077` 的 primary execution surface 切换到 `sprint-004-run-scope-resolution-and-routing-cutover`。

## 2. Depends On

1. `CR-006`
2. `sprint-003-review-workflow-and-verify-removal` 全部 `TK` 已 `completed`、全部 `CR` 已 `resolved`

## 3. 预期产物

1. 写回为 `completed` 的 `sprint-003` plan surface
2. 激活后的 `sprint-004` plan/task/review surface
3. 更新后的 `current-context.md`
4. 更新后的 `completed-streams-history.md`
5. `DA-745`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-003-review-workflow-and-verify-removal/plan.md`
5. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-004-run-scope-resolution-and-routing-cutover/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-003-review-workflow-and-verify-removal/tasks/CR-006.md`
2. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-003-review-workflow-and-verify-removal/review/resolved_code_review_working-tree-20260410-1337.md`

## 6. 实施计划

1. 将 `sprint-003` 计划面写回 `completed` 真值，并登记 closeout milestone。
2. 激活 `sprint-004` 计划面与 current-context primary routing。
3. 将 `stream-project-077-sprint-003` 写入 completed stream history，并产出 `DA-745` handoff artifact。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-code-review-status-sync.js`
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
8. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-745`
2. 同窗口代码验证证据复用 `CR-005` / `CR-006`：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-10：`sprint-003` 的 `TK-732 ~ TK-745` 与 `CR-001 ~ CR-006` 已全部进入终态，开始执行 sprint closeout 与下一 sprint activation handoff。
2. 2026-04-10：已将 `sprint-003` 写回 `completed`，激活 `sprint-004` 为新的 primary execution surface，并把 `stream-project-077-sprint-003` 迁入 completed stream history。
3. 2026-04-10：治理检查通过，任务完成。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-003-review-workflow-and-verify-removal/tasks/DA-745-sprint-003-closeout-and-sprint-004-activation-handoff.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-003-review-workflow-and-verify-removal/plan.md`
5. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-004-run-scope-resolution-and-routing-cutover/plan.md`
