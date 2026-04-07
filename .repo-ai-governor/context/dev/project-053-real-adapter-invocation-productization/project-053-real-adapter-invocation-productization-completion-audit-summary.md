# project-053 real adapter invocation productization completion audit summary

- Status: completed
- Date: 2026-04-07
- Audit Scope: `project-053-real-adapter-invocation-productization`
- Completion Conclusion: `completed`

## 1. Completion Conclusion

1. `project-053` 当前 completion conclusion 为 `completed`。
2. `CR-003` 已将 project-final scoped CR loop 收口为 clean，最终 closeout write-back 已由 `TK-610 / DA-610` 完成。
3. `project-053` 现已把 `claude-code`、`codex`、`github-copilot` 的 real-path truth 与 `local-model` 的 fallback-only positioning 收敛到统一、可回放的正式证据链。

## 2. Closeout Outcome

1. `project-053` 的 project / sprint / review / context history 已完成同窗口 closeout write-back。
2. 三个 sprint 的 adapter real-invocation 路径已按 `Claude Code -> Codex -> GitHub Copilot/local-model` 顺序完成产品化收口，并统一回写到 support matrix 与 adoption playbook。
3. 下一条 primary stream 已切换到 `project-054-vscode-secondary-surface-rollout / sprint-001-vscode-support-boundary-and-packaging-narrative`。

## 3. Audit Scope

1. `sprint-001-claude-code-real-invocation-baseline`
2. `sprint-002-codex-real-invocation-and-cross-tool-routing`
3. `sprint-003-github-copilot-boundary-and-local-model-positioning`

## 4. Task Completion Statistics

1. Total implementation / closeout tasks in project scope: `13`
2. Latest status `completed` or closeout-ready count: `13`
3. Remaining implementation gaps before review: `0`
4. Remaining governance steps before project completion claim: `0`

## 5. Key Evidence

1. `./plan.md`
2. `./sprint-001-claude-code-real-invocation-baseline/plan.md`
3. `./sprint-002-codex-real-invocation-and-cross-tool-routing/plan.md`
4. `./sprint-003-github-copilot-boundary-and-local-model-positioning/plan.md`
5. `./sprint-001-claude-code-real-invocation-baseline/review/resolved_code_review_working-tree-20260407-0031.md`
6. `./sprint-002-codex-real-invocation-and-cross-tool-routing/review/resolved_code_review_working-tree-20260407-0150.md`
7. `./sprint-002-codex-real-invocation-and-cross-tool-routing/review/resolved_code_review_working-tree-20260407-0213.md`
8. `./sprint-003-github-copilot-boundary-and-local-model-positioning/review/resolved_code_review_working-tree-20260407-0748.md`
9. `./sprint-003-github-copilot-boundary-and-local-model-positioning/review/resolved_code_review_working-tree-20260407-0810.md`
10. `./sprint-003-github-copilot-boundary-and-local-model-positioning/review/resolved_code_review_working-tree-20260407-0938.md`
11. `./sprint-003-github-copilot-boundary-and-local-model-positioning/tasks/DA-609-sprint-003-exit-acceptance-and-project-final-review-handoff.md`
12. `./sprint-003-github-copilot-boundary-and-local-model-positioning/tasks/DA-610-project-053-final-closeout-and-project-054-primary-stream-activation.md`
13. `./sprint-003-github-copilot-boundary-and-local-model-positioning/tasks/checklist.md`
14. `./sprint-003-github-copilot-boundary-and-local-model-positioning/tasks/tasks.csv`
15. `../../../../docs/support-matrix.md`
16. `../../../../docs/support-matrix.zh-CN.md`
17. `../../../../docs/local-adoption-playbook.md`
18. `../../../../docs/local-adoption-playbook.zh-CN.md`
19. `../../../../packages/adapters/github-copilot/README.md`
20. `../../../../packages/adapters/local-model/README.md`
21. `../../../../.tmp/project-053-sprint-003-verify-adapters-tk-605-606.json`
22. `../../../../.tmp/project-053-sprint-003-run-dry-run-trace-tk-605-606.json`
23. `../../../../.repo-ai-governor/context/current-context.md`
24. `../../../../.repo-ai-governor/context/completed-streams-history.md`

## 6. Delivered Capability Summary

1. `claude-code` 已正式进入 `Real-path available (environment-gated)` 支持口径，并形成稳定的 baseline truth。
2. `codex` 已形成默认 `cli_exec` 的真实调用与 routed dry-run acceptance 证据链。
3. `github-copilot` 已正式进入 `Real-path available (environment-gated)` 支持口径，且 `verify --adapters` 会把 tester route 如实投影为 `transport=cli_exec`。
4. `local-model` 已明确定义为 `Fallback-only real-path (local-runtime constrained)`，不再被误表述为 promoted primary lane。

## 7. Verification Evidence

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-worktree-review-target.js`（待同窗口复跑）
5. `pnpm run check`（通过）

## 8. Next-stream Recommendation

1. 下一条 primary stream 建议固定为 `project-054-vscode-secondary-surface-rollout / sprint-001-vscode-support-boundary-and-packaging-narrative`。
2. secondary surface 继续遵循 `VS Code first / desktop foundation`，先收口正式支持边界与 packaging narrative，再推进 MVP hardening。
3. `project-055`、`project-057`、`project-056` 继续保留为 follow-up queue，执行顺序不变。

## 9. Residual Risk And Follow-Up Advice

1. `verify --adapters` 的非阻断 bootstrap warn 仍会在 tool-managed workspace 初始化窗口出现，但它们已不再影响主 adapter required-role truth。
2. `project-054` 启动时，应先修正其 sprint-001 task card 为 canonical parseable `任务目标` 结构，并从 `TK-607` 的 boundary freeze 开始推进。
