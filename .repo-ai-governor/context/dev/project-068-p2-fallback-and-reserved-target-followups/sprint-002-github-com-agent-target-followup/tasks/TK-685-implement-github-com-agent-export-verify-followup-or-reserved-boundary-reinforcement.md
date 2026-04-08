# TK-685 implement github-com-agent export verify follow-up or reserved-boundary reinforcement

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P2`
- Project: `project-068-p2-fallback-and-reserved-target-followups`
- Sprint: `sprint-002-github-com-agent-target-followup`

## 1. 任务目标

根据 `TK-684` 的结论，执行有限的 `github-com-agent` export/verify follow-up，或强化 reserved-boundary reinforcement。

## 2. Depends On

1. `TK-684`
2. 当前 GitHub Copilot target-aware baseline

## 3. 预期产物

1. export/verify follow-up or reserved-boundary reinforcement
2. evidence input
3. backlog closeout input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-002-github-com-agent-target-followup/tasks/TK-684-freeze-github-com-agent-target-contract-and-blocked-mode-exit-criteria.md`
2. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/project-050-governance-surface-clients-host-distribution-rollout-completion-audit-summary.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/host-native-distribution-and-target-specific-consumption.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `.repo-ai-governor/context/dev/project-070-host-plugin-skill-agent-triad-sync/project-070-host-plugin-skill-agent-triad-sync-completion-audit-summary.md`

## 6. 实施计划

1. 落实有限的 export/verify follow-up 或 reinforce reserved boundary。
2. 收集 evidence 与 future unlock dependencies。
3. 交给 `TK-686` 做 backlog handoff。

## 7. Development Verification

1. reserved-target evidence review
2. export/verify boundary check

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run release:verify-github-com-agent-reserved-target -- --output .tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-code-review-status-sync.js`
7. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已把 reserved-boundary reinforcement 收敛为可重放证据链：新增 `scripts/release/verify-github-com-agent-reserved-target.mjs` 与 `package.json` 脚本 `release:verify-github-com-agent-reserved-target`，固定验证 `github-com-agent` staged export fail-closed、`--apply-to-repo` rejection、`host verify` blocking，以及 bundle packaging rejection。
3. 2026-04-08：已运行 `pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build` 与 `pnpm run release:verify-github-com-agent-reserved-target -- --output .tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json`，确认 reserved target 继续保持 schema-safe staged export + fail-closed support truth。
4. 2026-04-08：已把 report/backlink 入口同步到 `docs/local-adoption-playbook*.md`、`docs/maintainer-validation-playbook*.md` 与 `docs/support-matrix*.md`，当前任务状态切换为 `completed`，下一边界进入 `TK-686` backlog handoff 收口。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-github-com-agent-reserved-target.mjs`
2. `/Users/jimmydaddy/study/ai-governor/package.json`
3. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md`
4. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md`
5. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
6. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
7. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
8. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
9. `/Users/jimmydaddy/study/ai-governor/.tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json`
