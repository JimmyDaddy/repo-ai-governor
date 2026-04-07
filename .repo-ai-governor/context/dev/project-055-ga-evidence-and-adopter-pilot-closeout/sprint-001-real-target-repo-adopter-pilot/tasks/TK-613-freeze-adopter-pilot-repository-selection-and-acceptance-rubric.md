# TK-613 freeze adopter pilot repository selection and acceptance rubric

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-613`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-real-target-repo-adopter-pilot`
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`

## 1. 任务目标

冻结 adopter pilot 仓库选择与 acceptance rubric。

## 2. Depends On

1. `project-052`、`project-053` recommended

## 3. 预期产物

1. `DA-613-adopter-pilot-repository-selection-and-acceptance-rubric-freeze.md`
2. pilot repository selection
3. acceptance rubric
4. rehearsal boundary

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-051-priority-roadmap-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-588-priority-roadmap-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-004-adopter-pilot-and-documentation-closure/tasks/DA-234-sprint-004-activation-and-adopter-pilot-repository-freeze.md`
3. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-004-adopter-pilot-and-documentation-closure/tasks/DA-235-playground-adopter-pilot-baseline-and-gap-register.md`
4. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-004-adopter-pilot-and-documentation-closure/tasks/DA-236-react-native-image-marker-complex-adopter-pilot-and-gap-register.md`
5. `.tmp/project-046-p1-ga-onboarding-timing.json`

## 6. 实施计划

1. 确认 pilot 候选仓库与筛选约束。
2. 固化 acceptance rubric、timing capture 面与 rehearsal boundary。
3. 将冻结结果写回任务卡、delivery artifact 与台账。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `project-055` 激活。
2. 2026-04-07：`project-054` final closeout 完成后，当前任务已切换为 `in_progress`，作为新的 primary stream 起点。
3. 2026-04-07：已基于 `project-020`/`project-046` 的历史 pilot 证据与当前仓库状态，正式冻结 `/Users/jimmydaddy/study/playground` 与 `/Users/jimmydaddy/study/react-native-image-marker-1.1.x` 为本轮 pilot 仓库，并将 success rubric 写入 `DA-613`。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-613-adopter-pilot-repository-selection-and-acceptance-rubric-freeze.md`
2. `/Users/jimmydaddy/study/playground`
3. `/Users/jimmydaddy/study/react-native-image-marker-1.1.x`
