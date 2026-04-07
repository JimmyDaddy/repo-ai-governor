# TK-659 decompose current surface gap guide into project sprint and task packages

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-061-current-surface-gap-task-decomposition-draft`
- Sprint: `sprint-001-project-sprint-task-package-decomposition`

## 1. 任务目标

基于当前端面缺口分析与最新优先级判断，输出一份新的 project / sprint / task package 草案，让后续执行不再停留在“知道哪里有 gap”，而是能直接选择下一条 active stream 开工。

## 2. Depends On

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
3. `docs/support-matrix.md`

## 3. 预期产物

1. 当前端面缺口的 future project / sprint / task package 拆解 draft
2. 建议的 next primary stream 与 planned follow-up streams
3. 一组新的建议 `project-062+` 与 `TK-661+` 编号块

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
3. `docs/support-matrix.md`
4. `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
5. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
6. `.repo-ai-governor/draft/repo-ai-governor-priority-roadmap-project-sprint-task-package-proposal.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-current-app-feature-gap-priority-draft/plan.md`
2. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
3. `.repo-ai-governor/context/dev/project-059-cli-provider-continuity-fallback-truthfulness/plan.md`

## 6. 实施计划

1. 读取当前端面分析稿和最新优先级评估，识别仍应继续推进的 gap 主题。
2. 按 primary surface 影响度与 adopter 产品化价值，把 gap 归并成 future project。
3. 为每个 future project 设计最小 sprint 切分与 `TK-xxx` 任务包，并输出新的 draft。

## 7. Development Verification

1. docs/source cross-check：`product-requirements.md`、`docs/support-matrix.md`、两份上游 draft 与既有 project/sprint/task decomposition 样稿

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-659`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. docs-only decomposition window：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `in_progress`；本轮目标是把当前端面 gap 说明转成真正可执行的 task package。
2. 2026-04-08：已核对指定分析稿、最新 2026-04-08 优先级评估、PRD 与 support matrix，并确认拆解必须以更新后的当前真值为准。
3. 2026-04-08：已将 future stream 重新分解为 `project-062` 到 `project-067`，其中 `project-062` 为建议的下一条 primary stream。
4. 2026-04-08：已输出 `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`，任务完成。

## 10. 产出

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/plan.md`
3. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/sprint-001-project-sprint-task-package-decomposition/plan.md`
