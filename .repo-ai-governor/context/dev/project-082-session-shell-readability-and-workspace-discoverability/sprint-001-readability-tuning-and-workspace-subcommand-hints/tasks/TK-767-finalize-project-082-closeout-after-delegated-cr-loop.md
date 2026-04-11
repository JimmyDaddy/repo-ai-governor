# TK-767 finalize project-082 closeout after delegated CR loop

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-082-session-shell-readability-and-workspace-discoverability`
- Sprint: `sprint-001-readability-tuning-and-workspace-subcommand-hints`

## 1. 任务目标

在 `TK-765 / TK-766` 完成并通过 delegated CR loop 后，把 `project-082` 的 completion audit、task ledger、`current-context.md` 与 completed history 一次性收口到最终完成态。

## 2. Depends On

1. `TK-765`
2. `TK-766`
3. `CR-001`

## 3. 预期产物

1. `project-082` completion audit summary
2. 最终同步后的 project/sprint plan、task ledger、current-context 与 completed history
3. delegated CR closeout 结果摘要

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/plan.md`
2. `.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/sprint-001-readability-tuning-and-workspace-subcommand-hints/plan.md`
3. `.codex/skills/workspace-scoped-cr-loop/SKILL.md`

## 6. 实施计划

1. 在 `CR-001` clean `resolved` 后写入 project-level completion audit summary，并将 project/sprint plan 切回 `completed` 真值。
2. 同步 `TK-765 / TK-766 / TK-767 / CR-001` 的 canonical task-ledger sqlite、rendered checklist 与 `tasks.csv`。
3. 将 `project-082 / sprint-001` 从 active primary stream 迁入 completed history，并恢复 `current-context.md` idle 状态。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-767 --tasks-dir ".repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/sprint-001-readability-tuning-and-workspace-subcommand-hints/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`；将在 delegated CR loop clean 后推进为最终 closeout write-back。
2. 2026-04-11：`CR-001` 已 clean 收口为 `resolved`，本任务随即接手 project/sprint plan、completion audit、current-context 与 completed history 的最终 write-back。
3. 2026-04-11：已完成 `project-082` completion audit summary、project/sprint completed status、completed-stream history 回写与 idle context 恢复。
4. 2026-04-11：已通过 closeout 所需的 task-ledger / sprint-plan / code-review / worktree-review-target 治理门禁。

## 10. 产出

1. 已完成：project-082 completion audit summary -> `.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/project-082-session-shell-readability-and-workspace-discoverability-completion-audit-summary.md`
2. 已完成：completed history and idle-context write-back -> `.repo-ai-governor/context/completed-streams-history.md`、`.repo-ai-governor/context/current-context.md`
3. 已完成：final plan closeout sync -> `.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/plan.md`、`.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/sprint-001-readability-tuning-and-workspace-subcommand-hints/plan.md`
