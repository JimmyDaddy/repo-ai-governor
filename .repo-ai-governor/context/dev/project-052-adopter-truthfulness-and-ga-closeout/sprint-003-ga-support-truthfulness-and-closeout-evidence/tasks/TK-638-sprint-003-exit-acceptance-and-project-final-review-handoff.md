# TK-638 sprint-003 exit acceptance and project-final review handoff

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-638`
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`
- Sprint: `sprint-003-ga-support-truthfulness-and-closeout-evidence`

## 1. 任务目标

完成 `sprint-003` 的 closeout、治理写回与 project-final scoped CR handoff，让 `project-052` 可以在不丢失 sprint-003 truth surface 的前提下进入最终 project-level review。

## 2. Depends On

1. `TK-595`
2. `TK-596`
3. `TK-597`
4. `CR-001`
5. `CR-002`
6. `CR-003`

## 3. 预期产物

1. `DA-638-sprint-003-exit-acceptance-and-project-final-review-handoff.md`
2. 更新后的 `project-052` / `sprint-003` plan
3. 更新后的 `current-context.md` 与同步后的 sprint ledger

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-003-ga-support-truthfulness-and-closeout-evidence/plan.md`
4. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/project-052-adopter-truthfulness-and-ga-closeout-completion-audit-summary.md`
5. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-003-ga-support-truthfulness-and-closeout-evidence/review/resolved_code_review_working-tree-20260406-2228.md`
6. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-003-ga-support-truthfulness-and-closeout-evidence/review/resolved_code_review_working-tree-20260406-2244.md`
7. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-003-ga-support-truthfulness-and-closeout-evidence/review/resolved_code_review_working-tree-20260406-2257.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
3. `.codex/skills/workspace-scoped-cr-loop/SKILL.md`

## 6. 实施计划

1. 确认 `sprint-003` 的全部 `TK` 为 `completed` 且全部 `CR` 为 `resolved`。
2. 写出 sprint closeout artifact，并把 sprint / project 计划面同步到 closeout 后真值。
3. 保留当前 sprint 作为 project-final review surface，等待 project-level fresh reviewer loop。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-04-06：任务创建并在同一窗口完成，确认 `sprint-003` 的全部实现任务与 sprint-level CR rounds 已进入终态。
2. 2026-04-06：已完成 `DA-638`、sprint/project/current-context 写回，并把下一边界固定为 `project-052` 的 project-final scoped CR loop。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-003-ga-support-truthfulness-and-closeout-evidence/tasks/DA-638-sprint-003-exit-acceptance-and-project-final-review-handoff.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-003-ga-support-truthfulness-and-closeout-evidence/plan.md`
4. `.repo-ai-governor/context/current-context.md`
