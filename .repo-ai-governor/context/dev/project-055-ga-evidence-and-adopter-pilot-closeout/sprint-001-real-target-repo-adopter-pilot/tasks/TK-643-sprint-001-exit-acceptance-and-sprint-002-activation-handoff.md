# TK-643 sprint-001 exit acceptance and sprint-002 activation handoff

- Status: completed
- Date: 2026-04-07
- Task ID: `TK-643`
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`
- Sprint: `sprint-001-real-target-repo-adopter-pilot`

## 1. 任务目标

完成 `sprint-001` 的 closeout、治理写回与下一条执行面切换，让 `sprint-002` 可以在不丢失 adopter pilot truth baseline 的前提下正式激活。

## 2. Depends On

1. `TK-613`
2. `TK-614`
3. `TK-615`
4. `CR-001`

## 3. 预期产物

1. `DA-643-sprint-001-closeout-and-sprint-002-activation-handoff.md`
2. 更新后的 `current-context.md` 与 `completed-streams-history.md`
3. 更新后的 `project-055` / `sprint-001` / `sprint-002` plan 与同步后的 sprint ledger

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/plan.md`
4. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/plan.md`
5. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-002-ga-evidence-consolidation-and-closeout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
3. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/review/resolved_code_review_working-tree-20260407-1228.md`

## 6. 实施计划

1. 收口 `sprint-001` 的 review lifecycle、pilot evidence 与 closeout truth。
2. 更新 project / sprint 计划、current-context 与 completed stream history。
3. 激活 `sprint-002` 并同步首个 in-progress task，确保下一个执行边界可持续推进。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-07：任务创建并直接执行 sprint-001 closeout、context/history 写回与 sprint-002 activation handoff。
2. 2026-04-07：已完成 `DA-643`、project/sprint/context/history 写回，并激活 `sprint-002` 与 `TK-616`。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-643-sprint-001-closeout-and-sprint-002-activation-handoff.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/plan.md`
5. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/plan.md`
6. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-002-ga-evidence-consolidation-and-closeout/plan.md`
