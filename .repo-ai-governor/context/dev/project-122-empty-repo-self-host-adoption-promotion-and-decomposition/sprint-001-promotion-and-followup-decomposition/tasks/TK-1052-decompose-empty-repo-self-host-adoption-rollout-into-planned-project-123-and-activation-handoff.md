# TK-1052 decompose empty repo self-host adoption rollout into planned project-123 and activation handoff

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-122-empty-repo-self-host-adoption-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

把 formalized solution 拆解为可直接激活的 planned follow-up stream project-123-empty-repo-self-host-adoption-rollout，并形成 handoff artifact

## 2. Depends On

1. `TK-1051`

## 3. 预期产物

1. `project-123` 的 project / sprint / task package
2. `DA-1052` promotion and rollout decomposition handoff
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/draft/approved_solution_review_empty-repo-self-host-adoption-follow-up.md`
2. `.repo-ai-governor/context/current-context.md`
3. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/plan.md`

## 5. Traceback References

1. `.codex/skills/workspace-task-decomposition/SKILL.md`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/plan.md`
4. `.repo-ai-governor/context/current-context.md`

## 6. 实施计划

1. 创建 `project-123` 的四阶段 planned scaffold，覆盖 `Phase A -> Phase D` rollout 顺序。
2. 生成 `DA-1052` handoff artifact，并把 `project-123 / sprint-001` 登记到 `current-context.md` 的 planned follow-up stream。
3. 将 delivery registry 指向真实 planned project/sprint/task surface。

## 7. Development Verification

1. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/tasks" --task-id TK-1054 --task-id TK-1055 --task-id TK-1056`
2. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/tasks" --task-id TK-1057 --task-id TK-1058 --task-id TK-1059`
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/tasks" --task-id TK-1060 --task-id TK-1061 --task-id TK-1062`
4. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1063 --task-id TK-1064`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks" --task-id TK-1052`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-13：已创建 `project-123` 的四个 planned sprint、十一张 task card、checklist、tasks.csv 与 review scaffold。
3. 2026-05-13：已形成 `DA-1052` handoff artifact，并将 `project-123 / sprint-001` 登记到 `current-context.md` 的 planned follow-up stream。
4. 2026-05-13：delivery registry 已指向 `project-123` 的真实 planned rollout surface。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
3. `.repo-ai-governor/context/current-context.md`
