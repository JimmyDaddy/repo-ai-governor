# TK-716 sprint-001 closeout and project-final review activation handoff

- Status: planned
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-073-direct-answer-stability-and-governed-branch-switch-remediation`
- Sprint: `sprint-001-direct-answer-stability-and-branch-switch`

## 1. 任务目标

在 `TK-714`、`TK-715` 及对应 CR rounds clean 后完成 `sprint-001` closeout write-back，并把下一边界切换为 `project-073` project-final delegated review loop。

## 2. Depends On

1. `TK-714`
2. `TK-715`
3. `CR` fresh reviewer rounds for sprint boundaries

## 3. 预期产物

1. sprint-001 closeout / activation handoff artifact
2. 更新后的 sprint / project plan 真值
3. 同步后的 checklist / tasks.csv / sqlite ledger

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/plan.md`
3. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`

## 5. Traceback References

1. `TK-714`
2. `TK-715`
3. `后续 sprint review artifacts`

## 6. 实施计划

1. 校对 sprint-001 内所有 `TK` 与 `CR` 是否进入 clean terminal truth。
2. 生成 sprint closeout handoff 产物并同步 sprint/project plan 状态。
3. 将下一边界显式切换为 `project-073` project-final review loop。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-716 --tasks-dir ".repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/tasks"`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`，待 sprint 内实现任务与 CR rounds clean 后推进。

## 10. 产出

1. 待执行：sprint-001 closeout handoff artifact
2. 待执行：同步后的 sprint/project plan 与 ledger surfaces
