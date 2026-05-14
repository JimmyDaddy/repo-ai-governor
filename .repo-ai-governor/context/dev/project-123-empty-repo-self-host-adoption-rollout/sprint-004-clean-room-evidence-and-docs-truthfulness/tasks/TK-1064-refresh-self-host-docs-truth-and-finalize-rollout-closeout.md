# TK-1064 refresh self-host docs truth and finalize rollout closeout

- Status: planned
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-004-clean-room-evidence-and-docs-truthfulness`

## 1. 任务目标

同步 README、local-adoption playbook、support matrix 与 real self-host operator path，完成 delivery evidence、completion audit 与 project closeout

## 2. Depends On

1. run empty-repo self-host clean-room rehearsal and capture rollout evidence

## 3. 预期产物

1. docs/closeout artifact for TK-1064
2. task card update for TK-1064
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`
4. `.repo-ai-governor/draft/approved_solution_review_empty-repo-self-host-adoption-follow-up.md`

## 5. Traceback References

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

## 6. 实施计划

1. 基于 clean-room evidence 校准 README、local-adoption playbook 与 support matrix 的 public truth，避免继续保留与真实 operator path 不一致的引导。
2. 汇总 rollout delivery evidence、completion audit 与 project closeout 所需的正式回链产物。
3. 完成 sprint-004 与 project-123 的终态 ledger sync、验证与收口文档准备。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1064

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1064
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1064
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行后补齐
2. 待执行后补齐
