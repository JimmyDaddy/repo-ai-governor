# TK-616 consolidate support matrix GA evidence and maintainer validation outputs into one dossier

- Status: planned
- Date: 2026-04-06
- Task ID: `TK-616`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-ga-evidence-consolidation-and-closeout`
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`

## 1. 任务目标

把 support matrix、GA evidence 与 maintainer validation 汇总为统一 dossier。

## 2. Depends On

1. `TK-614`
2. `TK-615`

## 3. 预期产物

1. evidence dossier
2. support matrix alignment
3. GA evidence consolidation

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-002-ga-evidence-consolidation-and-closeout/plan.md`
4. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-614-execute-pilot-1-install-init-doctor-check-verify-dry-run-rehearsal-with-timing-evidence.md`
5. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-615-execute-pilot-2-upgrade-workspace-migration-rollback-rehearsal-and-capture-delta-findings.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`

## 6. 实施计划

1. 汇总 sprint-001 的 pilot、timing、delta findings 与 maintainer validation outputs。
2. 对齐 support matrix truth 与 GA dossier 结构。
3. 将 consolidated evidence 写回 sprint-002 交付面。

## 7. Development Verification

1. 待执行：evidence dossier targeted verification

## 8. Delivery Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `sprint-001` 收口。

## 10. 产出

1. 待执行：evidence dossier
2. 待执行：support matrix alignment
3. 待执行：GA evidence consolidation
