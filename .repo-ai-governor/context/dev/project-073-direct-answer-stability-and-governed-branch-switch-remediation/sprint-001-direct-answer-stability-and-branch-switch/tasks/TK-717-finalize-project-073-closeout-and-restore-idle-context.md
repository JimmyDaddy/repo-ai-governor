# TK-717 finalize project-073 closeout and restore idle context

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-073-direct-answer-stability-and-governed-branch-switch-remediation`
- Sprint: `sprint-001-direct-answer-stability-and-branch-switch`

## 1. 任务目标

在 `CR-006` clean `resolved` 后完成 `project-073` 的最终 closeout write-back，把 project / sprint / completion audit / current-context / completed stream history 一次性恢复到最终 completed / idle 真值。

## 2. Depends On

1. `TK-716`
2. `CR-006`

## 3. 预期产物

1. `project-073-direct-answer-stability-and-governed-branch-switch-remediation-completion-audit-summary.md`
2. `DA-717-project-073-final-closeout-and-idle-primary-stream-handoff.md`
3. 更新后的 `current-context.md` 与 `completed-streams-history.md`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/plan.md`
4. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/tasks/DA-716-sprint-001-closeout-and-project-final-review-activation-handoff.md`
2. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/review/resolved_code_review_working-tree-20260408-1953.md`
3. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/tasks/TK-715-add-governed-branch-switch-execution-path-for-session-main.md`

## 6. 实施计划

1. 写入 `project-073` completion audit summary 与 `DA-717`，补齐最终 closeout 证据链。
2. 将 project / sprint plan 恢复为 `completed` 真值，并把 `stream-project-073-sprint-001` 移入 completed history。
3. 将 `current-context.md` 恢复为无 active primary stream 的 `idle` 状态，并同步 canonical task ledger 与派生面。

## 7. Development Verification

1. 已校对 `TK-714`、`TK-715`、`TK-716` 的最新状态均为 `completed`。
2. 已校对 `CR-001` 至 `CR-006` 的最新状态均为 `resolved`。
3. 已校对本窗口只修改 docs / ledger closeout 产物，不新增 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码改动。

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-717 --tasks-dir ".repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`
6. `pnpm run check`
7. docs-only final closeout：本窗口未修改可执行代码，因此新增 `pnpm run build` not required；复用 `CR-006` 同窗口代码验证证据。

## 9. 执行记录

1. 2026-04-08：任务创建并在同一窗口直接推进到 `completed`，用于承接 `CR-006` clean `resolved` 之后的最终 project closeout write-back。
2. 2026-04-08：已写入 `DA-717` 与 completion audit summary，并将 `project-073 / sprint-001` plan、`current-context.md` 与 `completed-streams-history.md` 同步到最终 completed / idle 真值。
3. 2026-04-08：已完成 `TK-717` canonical task-ledger sync，并通过治理检查与 `pnpm run check`；由于本窗口未修改可执行代码，build not required。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/project-073-direct-answer-stability-and-governed-branch-switch-remediation-completion-audit-summary.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/tasks/DA-717-project-073-final-closeout-and-idle-primary-stream-handoff.md`
3. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/current-context.md`
4. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/completed-streams-history.md`
