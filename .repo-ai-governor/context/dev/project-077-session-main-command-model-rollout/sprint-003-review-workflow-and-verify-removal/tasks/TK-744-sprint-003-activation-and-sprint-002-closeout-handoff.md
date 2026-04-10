# TK-744 sprint-003 activation and sprint-002 closeout handoff

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-003-review-workflow-and-verify-removal`

## 1. 任务目标

激活 `sprint-003-review-workflow-and-verify-removal`，并将已完成的 `sprint-002-capability-model-and-plan-workflow-cutover` 从当前 primary execution surface 切换到 completed stream history。

## 2. Depends On

1. `CR-001`
2. `sprint-002-capability-model-and-plan-workflow-cutover` 全部 `TK` 已 `completed`、全部 `CR` 已 `resolved`

## 3. 预期产物

1. 激活后的 `sprint-003` plan/task/review surface
2. 更新后的 `current-context.md`
3. 更新后的 `completed-streams-history.md`
4. `DA-744`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-002-capability-model-and-plan-workflow-cutover/plan.md`
5. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-003-review-workflow-and-verify-removal/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-002-capability-model-and-plan-workflow-cutover/tasks/CR-001.md`
2. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-002-capability-model-and-plan-workflow-cutover/review/resolved_code_review_working-tree-20260410-0439.md`

## 6. 实施计划

1. 将 `sprint-002` 计划面写回 `completed` 真值，并登记 closeout milestone。
2. 激活 `sprint-003` 计划面与 current-context primary routing。
3. 将 `stream-project-077-sprint-002` 写入 completed stream history，并产出 `DA-744` handoff artifact。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-744`
2. docs-only governance handoff：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：`sprint-002` 的 `TK-729 ~ TK-731` 与 `CR-001` 已全部进入终态，开始执行 sprint closeout 与下一 sprint activation handoff。
3. 2026-04-10：已将 `sprint-002` 写回 `completed`，激活 `sprint-003` 为新的 primary execution surface，并把 `stream-project-077-sprint-002` 迁入 completed stream history。
4. 2026-04-10：治理检查通过，任务完成。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-003-review-workflow-and-verify-removal/tasks/DA-744-sprint-003-activation-and-sprint-002-closeout-handoff.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-002-capability-model-and-plan-workflow-cutover/plan.md`
5. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-003-review-workflow-and-verify-removal/plan.md`
