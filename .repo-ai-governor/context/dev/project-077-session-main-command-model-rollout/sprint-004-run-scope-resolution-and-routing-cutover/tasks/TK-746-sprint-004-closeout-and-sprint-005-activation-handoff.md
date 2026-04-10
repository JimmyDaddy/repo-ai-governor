# TK-746 sprint-004 closeout and sprint-005 activation handoff

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-004-run-scope-resolution-and-routing-cutover`

## 1. 任务目标

完成 `sprint-004-run-scope-resolution-and-routing-cutover` closeout，并将 `project-077` 的 primary execution surface 切换到 `sprint-005-regression-migration-cleanup-and-project-closeout`。

## 2. Depends On

1. `CR-002`
2. `sprint-004-run-scope-resolution-and-routing-cutover` 全部 `TK` 已 `completed`、全部 `CR` 已 `resolved`

## 3. 预期产物

1. 写回为 `completed` 的 `sprint-004` plan surface
2. 激活后的 `sprint-005` plan/task/review surface
3. 更新后的 `current-context.md`
4. 更新后的 `completed-streams-history.md`
5. 更新后的 `project-077 plan.md`
6. `DA-746`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-004-run-scope-resolution-and-routing-cutover/plan.md`
5. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/plan.md`
6. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/tasks/TK-738-remove-remaining-hidden-verify-shims-and-docs-residue.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-004-run-scope-resolution-and-routing-cutover/tasks/CR-002.md`
2. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-004-run-scope-resolution-and-routing-cutover/review/resolved_code_review_working-tree-20260410-1506.md`

## 6. 实施计划

1. 将 `sprint-004` 计划面写回 `completed` 真值，并登记 closeout milestone。
2. 激活 `sprint-005` 计划面与 current-context primary routing。
3. 将 `TK-738` 切换为 `in_progress`，作为 sprint-005 的第一条 active implementation boundary。
4. 将 `stream-project-077-sprint-004` 写入 completed stream history，并产出 `DA-746` handoff artifact。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir ".repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-004-run-scope-resolution-and-routing-cutover/tasks" --task-id TK-746`
2. 同窗口代码验证证据复用 `CR-001` / `CR-002`：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`、`pnpm run build`

## 9. 执行记录

1. 2026-04-10：`sprint-004` 的 `TK-735 ~ TK-737`、`CR-001`、`CR-002` 已全部进入终态，开始执行 sprint closeout 与下一 sprint activation handoff。
2. 2026-04-10：已将 `sprint-004` 写回 `completed`，激活 `sprint-005` 为新的 primary execution surface，并把 `stream-project-077-sprint-004` 迁入 completed stream history。
3. 2026-04-10：已将 `TK-738` 切换为 `in_progress`，作为 sprint-005 的当前 active implementation boundary；治理检查通过，任务完成。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-004-run-scope-resolution-and-routing-cutover/tasks/DA-746-sprint-004-closeout-and-sprint-005-activation-handoff.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/plan.md`
5. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-004-run-scope-resolution-and-routing-cutover/plan.md`
6. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/plan.md`
