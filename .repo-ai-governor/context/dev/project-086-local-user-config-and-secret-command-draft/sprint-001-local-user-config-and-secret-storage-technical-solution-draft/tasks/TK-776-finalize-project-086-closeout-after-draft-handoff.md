# TK-776 finalize project-086 closeout after draft handoff

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-086-local-user-config-and-secret-command-draft`
- Sprint: `sprint-001-local-user-config-and-secret-storage-technical-solution-draft`

## 1. 任务目标

在 `TK-775` 完成后收口 `project-086` 的 docs-only closeout，补齐 completion audit，并把当前执行流恢复到 idle 真值。

## 2. Depends On

1. `TK-775`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## 3. 预期产物

1. `project-086` completion audit summary
2. 同步后的 project/sprint plan、task ledger、current-context 与 completed history
3. 最终 closeout 验证结果

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
5. `.repo-ai-governor/context/dev/project-086-local-user-config-and-secret-command-draft/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/`
2. `.repo-ai-governor/context/dev/project-086-local-user-config-and-secret-command-draft/sprint-001-local-user-config-and-secret-storage-technical-solution-draft/tasks/TK-775-draft-local-user-config-and-secret-backed-command-configuration-technical-solution.md`

## 6. 实施计划

1. 汇总 `TK-775` 的交付证据与 draft 边界。
2. 写入 project-level completion audit summary，并切回 project/sprint `completed`。
3. 同步 sqlite canonical ledger、`checklist.md`、`tasks.csv`、`completed-streams-history.md` 与 `current-context.md`。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-776 --tasks-dir ".repo-ai-governor/context/dev/project-086-local-user-config-and-secret-command-draft/sprint-001-local-user-config-and-secret-storage-technical-solution-draft/tasks"`
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。
2. 2026-04-11：`TK-775` 已完成，并通过 technical-solution lifecycle gate 验证。
3. 2026-04-11：已创建 project-level completion audit summary，切回 project/sprint `completed` 真值，并把 `project-086 / sprint-001` 从 `current-context.md` active primary stream 迁入 completed history。
4. 2026-04-11：已执行最终 ledger/status gate 核验，确认 closeout 后的 checklist/tasks.csv、review lifecycle 与 idle context 同步无漂移。

## 10. 产出

1. 已完成：project-086 completion audit summary -> `.repo-ai-governor/context/dev/project-086-local-user-config-and-secret-command-draft/project-086-local-user-config-and-secret-command-draft-completion-audit-summary.md`
2. 已完成：completed truth write-back -> `.repo-ai-governor/context/current-context.md`、`.repo-ai-governor/context/completed-streams-history.md`
