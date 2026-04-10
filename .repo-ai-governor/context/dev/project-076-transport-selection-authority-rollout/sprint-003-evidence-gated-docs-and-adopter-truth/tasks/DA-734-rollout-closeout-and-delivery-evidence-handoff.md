# DA-734 rollout closeout and delivery evidence handoff

- Status: completed
- Date: 2026-04-10
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-003-evidence-gated-docs-and-adopter-truth`
- Task: `TK-734`

## 1. Summary

1. `CR-002` 修复并收口后，`project-076` 的 final closeout write-back 已完成。
2. `project-076 / sprint-003` 计划面、completion audit summary、`current-context.md`、completed stream history 与 technical solution delivery registry 已同步到最终完成态真值。
3. 当前 worktree 的默认 active primary stream 仍为 `project-077 / sprint-002`；`project-076 / sprint-003` 已不再占用 active closeout surface。

## 2. Closeout Actions

1. 将 `project-076` completion audit summary 切换到 `completed`，并补齐 project-final review、delivery registry 与 completed history 回链。
2. 将 `project-076` project plan 与 `sprint-003` sprint plan 恢复为 `completed` 真值，并完成 `TK-734` / `CR-002` 的 ledger closeout。
3. 将 `stream-project-076-sprint-003` 从 `current-context.md` active surface 移入 `completed-streams-history.md`。
4. 更新 `technical-solution.transport-selection-authority-and-strict-routing` delivery registry entry，使其 execution / rollout status 固定为 `completed`，并回链 `DA-734`、completion audit summary 与 project-final review evidence。

## 3. Active Stream Result

1. Primary Stream: `project-077-session-main-command-model-rollout / sprint-002-capability-model-and-plan-workflow-cutover`
2. Active Streams: `primary` only
3. Completed Closeout Stream: `stream-project-076-sprint-003`

## 4. Validation

1. `pnpm run build`
2. `pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（当前工作区仍报出与本任务无关的 `project-077 / sprint-002` 未提交 plan drift；未纳入 `project-076` closeout verdict）
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `node ./scripts/governance/check-worktree-review-target.js`
7. `node ./scripts/governance/check-docs-triad-sync.js`
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
