# TK-684 freeze github-com-agent target contract and blocked-mode exit criteria

- Status: in_progress
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P2`
- Project: `project-068-p2-fallback-and-reserved-target-followups`
- Sprint: `sprint-002-github-com-agent-target-followup`

## 1. 任务目标

冻结 `github-com-agent` target contract 与 blocked-mode exit criteria，明确 reserved target 何时才能离开 deferred 状态。

## 2. Depends On

1. `TK-710`
2. 当前 reserved target baseline

## 3. 预期产物

1. target contract
2. blocked-mode exit criteria
3. implementation input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/tasks/TK-683-implement-constrained-local-model-capability-followup-or-explicit-non-goal-guardrails.md`
2. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/project-050-governance-surface-clients-host-distribution-rollout-completion-audit-summary.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-069-host-plugin-skill-agent-decomposition-refresh/project-069-host-plugin-skill-agent-decomposition-refresh-completion-audit-summary.md`

## 6. 实施计划

1. 冻结 target contract 与 blocked-mode exit criteria。
2. 明确 required evidence 与 future unlock conditions。
3. 把 reserved-boundary follow-up 输入交给 `TK-685`。

## 7. Development Verification

1. target-contract review
2. deferred-boundary review

## 8. Delivery Verification

1. reserved-target contract review
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：`TK-710 / DA-710` 完成 `sprint-001` closeout 后，本任务已切换为当前 primary boundary 的 `in_progress`；接下来先冻结 `github-com-agent` target contract、blocked-mode exit criteria 与 future unlock evidence contract。

## 10. 产出

1. 待执行：target contract
2. 待执行：blocked-mode exit criteria
