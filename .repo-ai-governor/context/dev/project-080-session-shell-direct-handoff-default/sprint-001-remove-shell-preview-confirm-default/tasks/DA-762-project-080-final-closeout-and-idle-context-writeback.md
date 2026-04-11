# DA-762 project-080 final closeout and idle context writeback

- Status: completed
- Date: 2026-04-11
- Project: `project-080-session-shell-direct-handoff-default`
- Sprint: `sprint-001-remove-shell-preview-confirm-default`
- Task: `TK-762`

## 1. Summary

1. `project-080-session-shell-direct-handoff-default` 已完成最终 closeout。
2. session shell 默认 governed handoff 已回到 `direct_execute`，`/confirm` 与 `/cancel` 仅保留为隐藏兼容入口，不再继续占据默认 discoverability。
3. 当前 worktree 继续保持无 active primary stream，`project-080 / sprint-001` 已移入 completed history。

## 2. Closed Evidence

1. `TK-761`：已确认 `connect` 失败根因是 source config 缺少 `adapters` baseline，而不是 confirm 流程失效。
2. `TK-761`：已完成 capability / slash-command / i18n / docs / tests 的 direct handoff baseline 收口。
3. 相关 technical-solution 文档与 adoption playbook 已同步更新，不再将 shell-level `preview + confirm` 记录为默认治理基线。

## 3. Final Closeout Result

1. `project-080` plan 已恢复为最终 `completed` 真值，并追加 completion audit summary milestone backlink。
2. `sprint-001` plan 已恢复为最终 `completed` 真值。
3. `current-context.md` 继续保持 `idle`，`completed-streams-history.md` 已登记 `stream-project-080-sprint-001`。
4. `tasks/checklist.md`、`tasks/tasks.csv` 与 canonical task-ledger sqlite 已完成同步。

## 4. Verification Note

1. 同窗口代码验证证据：`pnpm exec vitest run apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`。
2. closeout 治理验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`。
