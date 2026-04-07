# TK-615 execute pilot-2 upgrade workspace migration rollback rehearsal and capture delta findings

- Status: planned
- Date: 2026-04-06
- Task ID: `TK-615`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-real-target-repo-adopter-pilot`
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`

## 1. 任务目标

执行 pilot-2 upgrade/workspace migration/rollback rehearsal，并记录 delta findings。

## 2. Depends On

1. `TK-613`

## 3. 预期产物

1. pilot-2 rehearsal
2. delta findings
3. rollback evidence

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/plan.md`
3. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-613-freeze-adopter-pilot-repository-selection-and-acceptance-rubric.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`

## 6. 实施计划

1. 在 `TK-613` 冻结的 rehearsal boundary 内选定 pilot-2 仓库与 upgrade inputs。
2. 顺序执行 upgrade / workspace migration / rollback rehearsal，并记录 delta findings。
3. 汇总 rollback evidence、问题分类与后续建议。

## 7. Development Verification

1. 待执行：pilot-2 targeted rehearsal verification

## 8. Delivery Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-613` 完成。

## 10. 产出

1. 待执行：pilot-2 rehearsal
2. 待执行：delta findings
3. 待执行：rollback evidence
