# TK-770 finalize project-083 closeout after delegated CR loop

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-083-session-shell-theme-choice-and-readability-followup`
- Sprint: `sprint-001-theme-preset-choice-and-readability-followup`

## 1. 任务目标

在 `TK-768 / TK-769` 完成并通过 delegated CR loop 后，把 `project-083` 的 completion audit、task ledger、`current-context.md` 与 completed history 一次性收口到最终完成态。

## 2. Depends On

1. `TK-768`
2. `TK-769`
3. `CR-001`

## 3. 预期产物

1. `project-083` completion audit summary
2. 最终同步后的 project/sprint plan、task ledger、current-context 与 completed history
3. delegated CR closeout 结果摘要

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/plan.md`
2. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/sprint-001-theme-preset-choice-and-readability-followup/plan.md`
3. `.codex/skills/workspace-scoped-cr-loop/SKILL.md`

## 6. 实施计划

1. 在 `CR-001` clean `resolved` 后写入 project-level completion audit summary，并将 project/sprint plan 切回 `completed` 真值。
2. 同步 `TK-768 / TK-769 / TK-770 / CR-001` 的 canonical task-ledger sqlite、rendered checklist 与 `tasks.csv`。
3. 将 `project-083 / sprint-001` 从 active primary stream 迁入 completed history，并恢复 `current-context.md` idle 状态。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-770 --tasks-dir ".repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/sprint-001-theme-preset-choice-and-readability-followup/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`；将在 delegated CR loop clean 后推进为最终 closeout write-back。
2. 2026-04-11：`CR-001` 已以 clean verdict 收口为 `resolved`，并写入 `resolved_code_review_working-tree-20260411-1134.md`。
3. 2026-04-11：已创建 project-level completion audit summary，切回 project/sprint `completed` 真值，并把 `project-083 / sprint-001` 从 `current-context.md` active primary stream 迁入 completed history。
4. 2026-04-11：已执行最终 ledger/status gate 核验，确认 closeout 后的 sqlite/checklist/tasks.csv、review lifecycle 与 idle context 同步无漂移。

## 10. 产出

1. 已完成：project-083 completion audit summary -> `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/project-083-session-shell-theme-choice-and-readability-followup-completion-audit-summary.md`
2. 已完成：completed history and idle-context write-back -> `.repo-ai-governor/context/completed-streams-history.md`、`.repo-ai-governor/context/current-context.md`
3. 已完成：final plan closeout sync -> `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/plan.md`、`.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/sprint-001-theme-preset-choice-and-readability-followup/plan.md`
