# project-073 direct-answer stability and governed branch-switch remediation completion audit summary

- Status: completed
- Date: 2026-04-08
- Audit Scope: `project-073-direct-answer-stability-and-governed-branch-switch-remediation`
- Completion Conclusion: `completed`

## 1. Completion Conclusion

1. `project-073` 当前 completion conclusion 为 `completed`。
2. `CR-006` 已确认 project-final delegated review loop 无新的 actionable findings，最终 closeout write-back 已由 `TK-717 / DA-717` 完成。
3. 用户报告的两个问题已经收口为稳定证据链：direct-answer 不再容易被脆弱 probe / invoke liveness 误伤，“切换到 main 分支”已进入受治理执行路径。

## 2. Closeout Outcome

1. `project-073` 的 project / sprint / task ledger / review / context history 已在同一工作流中完成 closeout write-back。
2. `sprint-001` 已固定 direct-answer preflight / fallback liveness 稳定性与 governed branch-switch capability 的最终交付边界。
3. 当前 worktree 已恢复为 `idle` primary-stream 状态，等待下一条显式激活的项目流。

## 3. Audit Scope

1. `sprint-001-direct-answer-stability-and-branch-switch`

## 4. Task Completion Statistics

1. Total implementation / closeout tasks in project scope: `4`
2. Latest `TK` status `completed` count: `4 / 4`
3. Latest `CR` status `resolved` count: `6 / 6`
4. Remaining implementation or governance gaps before project completion claim: `0`

## 5. Key Evidence

1. `./plan.md`
2. `./sprint-001-direct-answer-stability-and-branch-switch/plan.md`
3. `./sprint-001-direct-answer-stability-and-branch-switch/tasks/DA-716-sprint-001-closeout-and-project-final-review-activation-handoff.md`
4. `./sprint-001-direct-answer-stability-and-branch-switch/tasks/DA-717-project-073-final-closeout-and-idle-primary-stream-handoff.md`
5. `./sprint-001-direct-answer-stability-and-branch-switch/tasks/checklist.md`
6. `./sprint-001-direct-answer-stability-and-branch-switch/tasks/tasks.csv`
7. `./sprint-001-direct-answer-stability-and-branch-switch/review/resolved_code_review_working-tree-20260408-1635.md`
8. `./sprint-001-direct-answer-stability-and-branch-switch/review/resolved_code_review_working-tree-20260408-1702.md`
9. `./sprint-001-direct-answer-stability-and-branch-switch/review/resolved_code_review_working-tree-20260408-1731.md`
10. `./sprint-001-direct-answer-stability-and-branch-switch/review/resolved_code_review_working-tree-20260408-1907.md`
11. `./sprint-001-direct-answer-stability-and-branch-switch/review/resolved_code_review_working-tree-20260408-1924.md`
12. `./sprint-001-direct-answer-stability-and-branch-switch/review/resolved_code_review_working-tree-20260408-1953.md`
13. `../../../../apps/cli/src/runtime/session-main-supervisor-runtime.ts`
14. `../../../../apps/cli/src/commands/workspace-command.ts`
15. `../../../../apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
16. `../../../../apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`
17. `../../../../apps/cli/test/runtime/session-slash-command-registry.test.ts`
18. `../../../../apps/cli/test/commands/workspace-command.test.ts`
19. `../../../../apps/cli/test/cli-governance-runtime.integration.test.ts`
20. `../../../../packages/adapters/codex/src/codex-agent-adapter.ts`
21. `../../../../packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
22. `../../../../packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts`
23. `../../../../packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
24. `../../../../packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
25. `../../../../packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
26. `../../../../packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
27. `../../../../.repo-ai-governor/context/current-context.md`
28. `../../../../.repo-ai-governor/context/completed-streams-history.md`

## 6. Delivered Capability Summary

1. `session.main` direct-answer 现在优先走首个安全 surface，并在首选 invoke 失败时自动退化到下一个安全 surface，降低 probe 慢或 transport-idle 误判带来的失败率。
2. Codex invoke liveness suspect 诊断现在更保守，减少“连接不稳定 / 回答失败”场景里的误杀与过早升级。
3. “切换到 main 分支”这一类请求现在可以进入 `branch_switch` governed capability、`/workspace switch-branch <branch>` 预览确认链路和本地执行路径，而不是只能停留在 chat-only 拒绝文案。

## 7. Verification Evidence

1. `pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）
7. `pnpm run check`（通过）

## 8. Next-stream Recommendation

1. 当前无默认 active primary stream；若继续执行新的 project / sprint，应先显式更新 `current-context.md` 再进入下一轮实施。

## 9. Residual Risk And Follow-Up Advice

1. `project-073` 范围内未保留阻断性遗留项；后续仅在再次出现 provider-specific liveness 误判或新的 governed workspace action 需求时，按新项目流处理即可。
