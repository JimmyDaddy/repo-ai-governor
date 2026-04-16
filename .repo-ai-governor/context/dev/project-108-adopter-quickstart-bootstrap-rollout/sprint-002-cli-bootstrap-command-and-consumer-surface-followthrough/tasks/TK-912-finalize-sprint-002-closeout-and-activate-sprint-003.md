# TK-912 finalize sprint-002 closeout and activate sprint-003

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P0
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough`

## 1. 任务目标

在 `CR-001` clean 收口后完成 sprint-002 closeout write-back，并将 `sprint-003-cleanroom-evidence-and-rollout-closeout` 切换为新的 primary execution surface。

## 2. Depends On

1. `CR-001`
2. `.repo-ai-governor/context/current-context.md`

## 3. 预期产物

1. updated sprint-002 / sprint-003 / project plans
2. updated `current-context.md`, completed stream history, and delivery registry truth
3. sprint-002 closeout handoff artifact and local delivery boundary evidence

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/plan.md`
5. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/plan.md`
6. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-003-cleanroom-evidence-and-rollout-closeout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/tasks/CR-001.md`
2. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/review/resolved_code_review_working-tree-20260416-0043.md`
3. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-901-sprint-001-closeout-and-sprint-002-activation-handoff.md`

## 6. 实施计划

1. 将 sprint-002 的 task ledger、plan 与 review surface 收口为 `completed`。
2. 将 `sprint-003` 切换为 primary active stream，并更新 project WBS / milestone truth。
3. 将 delivery registry 的 `technical-solution.adopter-quickstart-bootstrap-command` entry 前移到 `sprint-003` closeout surface，并把 rollout status 推进到 `in_progress`。
4. 在通过 `pnpm run check` 后创建 sprint-002 本地边界提交，但不推送。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-worktree-review-target.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-04-16：任务创建并立即切换为 `in_progress`，开始执行 sprint-002 closeout、sprint-003 activation、delivery registry 前移与本地边界提交准备。
2. 2026-04-16：已完成 current-context / delivery registry / plan write-back，并生成 `DA-912` handoff；`pnpm run check` 已通过，sprint-002 具备本地边界提交条件。

## 10. 产出

1. 已完成：`.repo-ai-governor/context/current-context.md`
2. 已完成：`.repo-ai-governor/context/completed-streams-history.md`
3. 已完成：`.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. 已完成：`.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/tasks/DA-912-sprint-002-closeout-and-sprint-003-activation-handoff.md`
