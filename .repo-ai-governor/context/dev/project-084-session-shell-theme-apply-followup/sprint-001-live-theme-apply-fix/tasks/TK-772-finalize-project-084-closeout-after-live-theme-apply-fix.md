# TK-772 finalize project-084 closeout after live theme apply fix

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-084-session-shell-theme-apply-followup`
- Sprint: `sprint-001-live-theme-apply-fix`

## 1. 任务目标

在 `TK-771` 完成后，把 `project-084` 的 completion audit、task ledger、project/sprint plan 与 `current-context.md` 一次性收口到最终完成态。

## 2. Depends On

1. `TK-771`

## 3. 预期产物

1. `project-084` completion audit summary
2. 同步后的 project/sprint plan、task ledger、current-context 与 completed history
3. 最终 closeout 验证结果

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/plan.md`
2. `.repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/sprint-001-live-theme-apply-fix/plan.md`

## 6. 实施计划

1. 在 `TK-771` 完成后写入 project-level completion audit summary，并把 project/sprint plan 切回 `completed`。
2. 同步 `TK-771 / TK-772` 的 canonical task ledger、rendered checklist 与 `tasks.csv`。
3. 将 `project-084 / sprint-001` 从 active primary stream 迁入 completed history，并恢复 `current-context.md` idle 状态。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-772 --tasks-dir ".repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/sprint-001-live-theme-apply-fix/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。
2. 2026-04-11：`TK-771` 已完成并通过 targeted vitest + `pnpm run build` 验证。
3. 2026-04-11：已创建 project-level completion audit summary，切回 project/sprint `completed` 真值，并把 `project-084 / sprint-001` 从 `current-context.md` active primary stream 迁入 completed history。
4. 2026-04-11：已执行最终 ledger/status gate 核验，确认 closeout 后的 sqlite/checklist/tasks.csv、review lifecycle 与 idle context 同步无漂移。

## 10. 产出

1. 已完成：project-084 completion audit summary -> `.repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/project-084-session-shell-theme-apply-followup-completion-audit-summary.md`
2. 已完成：completed history and idle-context write-back -> `.repo-ai-governor/context/completed-streams-history.md`、`.repo-ai-governor/context/current-context.md`
3. 已完成：final plan closeout sync -> `.repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/plan.md`、`.repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/sprint-001-live-theme-apply-fix/plan.md`
