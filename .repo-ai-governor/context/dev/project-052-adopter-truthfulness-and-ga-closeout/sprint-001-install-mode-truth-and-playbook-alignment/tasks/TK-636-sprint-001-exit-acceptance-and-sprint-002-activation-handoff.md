# TK-636 sprint-001 exit acceptance and sprint-002 activation handoff

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-636`
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`
- Sprint: `sprint-001-install-mode-truth-and-playbook-alignment`

## 1. 任务目标

完成 `sprint-001` 的 closeout、治理写回与下一条执行面切换，让 `sprint-002` 可以在不丢失 install-mode truth baseline 的前提下正式激活。

## 2. Depends On

1. `TK-589`
2. `TK-590`
3. `TK-591`
4. `CR-001`
5. `CR-002`

## 3. 预期产物

1. `DA-636-sprint-001-closeout-and-sprint-002-activation-handoff.md`
2. 更新后的 `current-context.md` 与 `completed-streams-history.md`
3. 更新后的 `project-052` / `sprint-001` / `sprint-002` plan 与同步后的 sprint ledger

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
4. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/plan.md`
5. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/review/resolved_code_review_working-tree-20260406-2013.md`
4. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/review/resolved_code_review_working-tree-20260406-2032.md`

## 6. 实施计划

1. 收口 `sprint-001` 的 review lifecycle、acceptance evidence 与 closeout truth。
2. 更新 project / sprint 计划、current-context 与 completed stream history。
3. 激活 `sprint-002` 并同步首个 in-progress task，确保下一个执行边界可持续推进。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-code-review-status-sync.js`
3. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-04-06：任务创建并切换为 `in_progress`，开始执行 sprint-001 closeout 与 sprint-002 activation handoff。
2. 2026-04-06：已完成 `DA-636`、project/sprint/context/history 写回，并激活 `sprint-002` 与 `TK-592`。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-636-sprint-001-closeout-and-sprint-002-activation-handoff.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
5. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/plan.md`
6. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/plan.md`
