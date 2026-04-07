# TK-649 sprint-004 exit acceptance and project-final review activation handoff

- Status: completed
- Date: 2026-04-07
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-004-coverage-reporting-and-rollout-adoption`

## 1. 任务目标

在 `TK-633`、`TK-634`、`TK-635` 与 `CR-001` 全部进入终态后，完成 `sprint-004` 的出口验收、closeout write-back，并把当前 surface 保留为 `project-057` project-final CR loop 的默认 review/task 面。

## 2. Depends On

1. `TK-633`
2. `TK-634`
3. `TK-635`
4. `CR-001`

## 3. 预期产物

1. sprint-004 closeout summary
2. project-final review activation handoff notes
3. 更新后的 sprint / project plan、task ledger 与 `current-context.md`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
3. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/plan.md`
4. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/tasks.csv`
5. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/review/resolved_code_review_working-tree-20260407-1827.md`
6. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/DA-635-project-057-rollout-handoff-and-adoption-evidence-baseline.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure/tasks/TK-648-sprint-003-exit-acceptance-and-sprint-004-activation-handoff.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure/tasks/DA-648-sprint-003-closeout-and-sprint-004-activation-handoff.md`
3. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/DA-635-project-057-rollout-handoff-and-adoption-evidence-baseline.md`

## 6. 实施计划

1. 汇总 sprint-004 当前所有已终态任务与 review evidence，确认出口验收输入完整。
2. 形成 sprint-004 closeout summary 与 project-final CR activation handoff 所需输入。
3. 在 closeout 完成后同步 project/sprint plan、task ledger 与 `current-context.md`，但保留当前 surface 作为 project-final review 默认输出面。

## 7. Development Verification

1. 校对 `tasks.csv` 最新终态是否已覆盖 `TK-633`、`TK-634`、`TK-635` 与 `CR-001`。
2. 校对 `sprint-004` 在进入 completed truth 后，`current-context.md` 仍明确保留 project-final CR 使用的 active closeout surface。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 9. 执行记录

1. 2026-04-07：在 `TK-633`、`TK-634`、`TK-635` 与 `CR-001` 全部进入终态后创建本任务。
2. 2026-04-07：已完成 `DA-649`、project/sprint/context 写回，并将 sprint-004 恢复为 completed truth；当前 surface 保留给后续 project-final CR loop。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/DA-649-sprint-004-closeout-and-project-final-review-activation-handoff.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
4. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/plan.md`
