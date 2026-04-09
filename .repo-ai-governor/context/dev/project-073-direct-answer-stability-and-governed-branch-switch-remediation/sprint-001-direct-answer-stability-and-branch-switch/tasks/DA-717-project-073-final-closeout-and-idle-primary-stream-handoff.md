# DA-717 project-073 final closeout and idle primary-stream handoff

- Status: completed
- Date: 2026-04-08
- Project: `project-073-direct-answer-stability-and-governed-branch-switch-remediation`
- Sprint: `sprint-001-direct-answer-stability-and-branch-switch`
- Task: `TK-717`

## 1. Summary

1. `CR-006` clean `resolved` 后，`project-073` 的 final closeout write-back 已完成。
2. `project-073 / sprint-001` 的 plan、completion audit summary、`current-context.md` 与 completed stream history 已同步到最终 completed / idle 真值。
3. `session.main` direct-answer 稳定性修复与受治理分支切换能力补齐已全部以任务、review 与 closeout 证据链收口。

## 2. Closeout Actions

1. 写入 `project-073` completion audit summary，并回链 `TK-714`、`TK-715`、`TK-716 / DA-716` 与 `CR-006` 的关键证据。
2. 将 `project-073` project plan 与 `sprint-001` sprint plan 恢复为最终 `completed` 真值，并把 `TK-717` 纳入任务包与项目 WBS。
3. 将 `stream-project-073-sprint-001` 从 `current-context.md` active surface 移入 `completed-streams-history.md`。
4. 清空默认 active primary stream，使当前 worktree 回到显式启动下一条项目流之前的 `idle` 状态。

## 3. Idle Stream Result

1. Primary Stream Status: `idle`
2. Active Streams: `none`
3. Idle note: 当前 `project-073` 已完成最终 closeout；如需继续新的 project / sprint，需要显式激活新的 primary stream。

## 4. Verification

1. 复用 `CR-006` 同窗口代码验证证据：`pnpm exec vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. 复用 `CR-006` 同窗口 build evidence：`pnpm run build`
3. final closeout docs-only / ledger-only 验证：`node ./scripts/governance/check-task-ledger-sync.js`
4. final closeout docs-only / ledger-only 验证：`node ./scripts/governance/check-sprint-plan-status-sync.js`
5. final closeout docs-only / ledger-only 验证：`node ./scripts/governance/check-code-review-status-sync.js`
6. final closeout docs-only / ledger-only 验证：`node ./scripts/governance/check-worktree-review-target.js`
7. final closeout docs-only / ledger-only 验证：`pnpm run check`
