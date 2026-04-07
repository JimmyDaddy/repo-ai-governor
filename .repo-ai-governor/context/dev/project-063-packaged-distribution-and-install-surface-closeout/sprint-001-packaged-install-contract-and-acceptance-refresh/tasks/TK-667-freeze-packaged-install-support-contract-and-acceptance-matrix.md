# TK-667 freeze packaged install support contract and acceptance matrix

- Status: in_progress
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-063-packaged-distribution-and-install-surface-closeout`
- Sprint: `sprint-001-packaged-install-contract-and-acceptance-refresh`

## 1. 任务目标

冻结 packaged install support contract 与 acceptance matrix，明确 `path / link / dist-binary / tgz` 的正式边界。

## 2. Depends On

1. `project-062` recommended
2. `DA-696`

## 3. 预期产物

1. packaged install contract
2. acceptance matrix
3. implementation decision input

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/project-052-adopter-truthfulness-and-ga-closeout-completion-audit-summary.md`

## 6. 实施计划

1. 统一 packaged install 相关 support claims。
2. 冻结 acceptance matrix 与 clean-room coverage 范围。
3. 把 implementation choice 交给 `TK-668`。

## 7. Development Verification

1. install-mode contract review
2. support-matrix acceptance coverage check

## 8. Delivery Verification

1. clean-room rehearsal
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：`project-062` final closeout 完成后，当前任务切换为 `in_progress`，开始冻结 `path / link / dist-binary / tgz` 的 packaged install support contract 与 acceptance matrix。

## 10. 产出

1. 待执行：packaged install contract
2. 待执行：acceptance matrix
