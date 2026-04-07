# TK-687 refresh decomposition draft with codex claude plugin skill and agent carry slot

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-069-host-plugin-skill-agent-decomposition-refresh`
- Sprint: `sprint-001-host-ergonomics-carry-slot-refresh`

## 1. 任务目标

修正当前 project / sprint / task decomposition draft 中遗漏的 Codex / Claude Code plugin / skill / agent 承载位，让后续 host ergonomics 方案有明确 future stream。

## 2. Depends On

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `project-050` host-native distribution closeout evidence

## 3. 预期产物

1. 更新后的当前端面 gap decomposition draft
2. 一条新的 host plugin / skill / agent lifecycle follow-up future project
3. 调整后的 `project-068` P2 fallback/reserved target follow-up 编号与任务包

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
3. `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
4. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/project-050-governance-surface-clients-host-distribution-rollout-completion-audit-summary.md`
5. `README.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/plan.md`

## 6. 实施计划

1. 复核 `project-050` 已完成的 host-native distribution scope，确认哪些已完成、哪些仍缺 future carry slot。
2. 在当前拆解稿中新增一条 Codex / Claude Code host ergonomics future project。
3. 重排后续 P2 follow-up 项目编号与任务编号，保持整份草案连续可读。

## 7. Development Verification

1. docs/source cross-check：current decomposition draft、current surface guide、project-050 host rollout completion audit

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-687`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. docs-only refresh window：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `in_progress`；本轮目标是补上 Codex / Claude Code plugin/skill/agent 方案的承载位。
2. 2026-04-08：已复核 `project-050` 完成态，确认 project-local assets、plugin bundles、Claude hooks、Codex subagents 等 baseline 已完成，但缺少后续 lifecycle / adopter consumption carry slot。
3. 2026-04-08：已更新当前拆解稿，新增 `project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption`，并把 P2 follow-up 顺延为 `project-068`。
4. 2026-04-08：文档修订完成。

## 10. 产出

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `.repo-ai-governor/context/dev/project-069-host-plugin-skill-agent-decomposition-refresh/plan.md`
3. `.repo-ai-governor/context/dev/project-069-host-plugin-skill-agent-decomposition-refresh/sprint-001-host-ergonomics-carry-slot-refresh/plan.md`
