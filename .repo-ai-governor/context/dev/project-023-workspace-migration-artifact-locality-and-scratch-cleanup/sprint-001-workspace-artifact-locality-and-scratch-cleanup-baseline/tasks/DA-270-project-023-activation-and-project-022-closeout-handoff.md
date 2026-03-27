# DA-270 project-023 activation and project-022 closeout handoff

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-270`
- Project: `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`
- Sprint: `sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline`

## 1. Activation Conclusion

1. `project-023 / sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline` 已正式激活，并接管当前 workspace migration ergonomics follow-up 主执行流。
2. `current-context.md` 已从 `project-022 / sprint-003` closeout surface 切换到新的 primary stream。
3. `project-022 / sprint-003` 已迁入 `.repo-ai-governor/context/completed-streams-history.md`，不再占用默认 active closeout surface。

## 2. Sprint-001 Scope Freeze

1. 本轮只收敛三类 follow-up：
   - workspace artifact locality target-root contract
   - rollback scratch cleanup
   - adopter-facing workspace migration truthfulness
2. 不在本轮承诺：
   - broader package-manager-neutral onboarding polish
   - external baseline warning 全面重构
   - unrelated workspace lifecycle feature expansion

## 3. Seed Tasks

1. `TK-271` 已建卡，用于明确 artifact locality 的 canonical contract 与 target-root 决策。
2. `TK-272`、`TK-273` 已建卡，用于 locality cutover 与 scratch cleanup hardening。
3. `TK-274` 已建卡，用于 sprint-001 验收与 `project-023` 完成态评估。

## 4. Validation

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-worktree-review-target.js`
