# TK-684 freeze github-com-agent target contract and blocked-mode exit criteria

- Status: completed
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
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：`TK-710 / DA-710` 完成 `sprint-001` closeout 后，本任务已切换为当前 primary boundary 的 `in_progress`；接下来先冻结 `github-com-agent` target contract、blocked-mode exit criteria 与 future unlock evidence contract。
3. 2026-04-08：已冻结 `github-com-agent` reserved-target contract：target id 与 renderer path 可以继续保持 schema-safe staged export，但 capability profile 仍固定为 `supportedModes=[]`、`staged_export only`、`supportsApplyToRepo=false`、`supportsBundlePackaging=false`、`isMvpTarget=false`，不得被误读成正式 adopter-facing support。
4. 2026-04-08：已同步收口 blocked-mode exit criteria：只有当 target 至少具备一个 supported mode 与 discoverable/installed consumer path、拿到 pass 级 target-specific export/verify evidence，并证明 GitHub.com consumption 仍通过 canonical governor runtime handoff 时，`github-com-agent` 才能离开 deferred 状态；本轮未修改 executable surface，因此 build not required。
5. 2026-04-08：已将上述 contract 写回 `packages/adapters/github-copilot/README.md`、`docs/local-adoption-playbook*.md`、`docs/maintainer-validation-playbook*.md` 与 `docs/support-matrix*.md`，当前任务状态切换为 `completed`，下一边界进入 `TK-685`。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/packages/adapters/github-copilot/README.md`
2. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md`
3. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md`
4. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
5. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
6. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
7. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
