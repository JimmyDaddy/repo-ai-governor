# TK-934 decompose vscode governance workbench rollout into planned project-112 and activation handoff

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P0
- Project: `project-111-vscode-workbench-solution-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-rollout-handoff`

## 1. 任务目标

把 formalized solution 拆解为可直接激活的 planned follow-up stream `project-112-vscode-governance-workbench-rollout`，并形成 handoff artifact。

## 2. Depends On

1. TK-933

## 3. 预期产物

1. `project-112` 的 project / sprint / task package
2. `DA-934` promotion and rollout decomposition handoff
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/draft/approved_solution_review_vscode-full-governance-workbench-and-task-driven-orchestration.md
2. .repo-ai-governor/context/current-context.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/plan.md

## 5. Traceback References

1. .codex/skills/workspace-task-decomposition/SKILL.md
2. .repo-ai-governor/context/technical-solution-delivery-registry.yaml
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/plan.md
4. .repo-ai-governor/context/current-context.md

## 6. 实施计划

1. 创建 `project-112` 的多 sprint planned scaffold，覆盖 `Phase A -> Phase B -> Phase C` rollout 顺序。
2. 生成 `DA-934` handoff artifact，并把 `project-112 / sprint-001` 登记到 `current-context.md` 的 planned follow-up stream。
3. 将 delivery registry 指向真实 planned project/sprint/task surface。

## 7. Development Verification

1. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/tasks" --task-id TK-936 --task-id TK-937`
2. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-002-phase-b-outer-loop-consolidation-and-operations/tasks" --task-id TK-938 --task-id TK-939`
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/tasks" --task-id TK-940 --task-id TK-941`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks" --task-id TK-934`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 9. 执行记录

1. 2026-04-16：任务创建，状态初始化为 `planned`。
2. 2026-04-16：已创建 `project-112` 的三个 planned sprint、六个 task card、checklist、tasks.csv 与 review scaffold。
3. 2026-04-16：已形成 `DA-934` handoff artifact，并将 `project-112 / sprint-001` 登记到 `current-context.md` 的 planned follow-up stream。
4. 2026-04-16：delivery registry 已指向 `project-112` 的真实 planned rollout surface。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
3. `.repo-ai-governor/context/current-context.md`
