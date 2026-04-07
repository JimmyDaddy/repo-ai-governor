# TK-647 sprint-002 exit acceptance and sprint-003 activation handoff

- Status: completed
- Date: 2026-04-07
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-002-provenance-aware-findings-and-hybrid-review-baseline`

## 1. 任务目标

在 `TK-627`、`TK-628`、`TK-629`、`TK-646`、`CR-001` 与 `CR-002` 全部进入终态后，完成 `sprint-002` 的出口验收、closeout write-back，并正式激活 `sprint-003`。

## 2. Depends On

1. `TK-627`
2. `TK-628`
3. `TK-629`
4. `TK-646`
5. `CR-001`

## 3. 预期产物

1. sprint-002 closeout summary
2. sprint-003 activation handoff notes
3. 更新后的 sprint / project plan、task ledger 与 `current-context.md`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
3. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline/plan.md`
4. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline/tasks/tasks.csv`
5. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline/review/resolved_code_review_working-tree-20260407-1632.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-001-review-rule-registry-and-provenance-baseline/tasks/TK-624-sprint-001-exit-acceptance-and-sprint-002-activation-handoff.md`
2. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline/tasks/TK-646-create-technical-solution-review-skill-workflow-and-approval-guardrails.md`
3. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline/review/resolved_code_review_working-tree-20260407-1632.md`

## 6. 实施计划

1. 汇总 sprint-002 当前所有已终态任务与 review evidence，确认出口验收输入完整。
2. 形成 closeout summary 与 sprint-003 activation handoff 所需的输入约束。
3. 在 closeout 完成后同步 project/sprint plan、task ledger 与 `current-context.md`。

## 7. Development Verification

1. 校对 `tasks.csv` 的最新终态是否已覆盖 `TK-627`、`TK-628`、`TK-629`、`TK-646` 与 `CR-001`。
2. 校对 closeout 创建后 sprint aggregate status 是否回到合法的 `active`。

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-07：在 `TK-627`、`TK-628`、`TK-629`、`TK-646` 与 `CR-001` 全部进入终态后创建本任务。
2. 2026-04-07：状态切换为 `in_progress`，开始整理 sprint-002 closeout 与 sprint-003 activation handoff 输入。
3. 2026-04-07：`CR-002` clean `resolved` 后，已完成 `DA-647`、project/sprint/context/history 写回，并激活 `sprint-003 / TK-630`。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline/tasks/DA-647-sprint-002-closeout-and-sprint-003-activation-handoff.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
5. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline/plan.md`
6. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure/plan.md`
