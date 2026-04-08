# DA-716 sprint-001 closeout and project-final review activation handoff

- Status: completed
- Date: 2026-04-08
- Project: `project-073-direct-answer-stability-and-governed-branch-switch-remediation`
- Sprint: `sprint-001-direct-answer-stability-and-branch-switch`
- Task: `TK-716`

## 1. Summary

1. `sprint-001-direct-answer-stability-and-branch-switch` 已完成 sprint-level closeout。
2. 当前 primary stream 继续保持 `project-073 / sprint-001`，但该 surface 现在专供 `project-073` 的 project-final delegated review loop 与最终项目收口复用。
3. `TK-714`、`TK-715` 与 `CR-001 ~ CR-005` 的实现、修复与治理写回证据已经齐备，可以直接进入 `project-073` 的 project-final fresh reviewer loop。

## 2. Closed Evidence

1. `TK-714`：已完成 direct-answer preflight 快路径、invoke failure fallback 与更保守的 Codex liveness suspect 调整，并完成 clean `CR-001` 修复闭环。
2. `TK-715`：已完成 `branch_switch` capability、`/workspace switch-branch` discoverability、governed execution path、i18n 对齐与分支 token 路由修复，并完成 `CR-002 ~ CR-005` clean delegated review loop。
3. `CR-001 ~ CR-005`：全部进入 `resolved`，当前 sprint 的 delegated boundary 已无未收口 review artifact。

## 3. Project-Final Activation Result

1. `project-073` plan 继续保持 `active`，并新增 `TK-716` closeout handoff 记录。
2. `sprint-001` plan 继续保持 `active`，等待后续 `project-final` CR round 打开并收口后再恢复最终 `completed` 真值。
3. 当前 sprint 的 `tasks/` 与 `review/` 目录继续作为 `project-073` project-final review 的默认 surface。

## 4. Verification Note

1. 本 closeout / project-final activation handoff 为 docs-only / ledger-only 变更；本窗口未修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 下可执行代码，因此新增 build evidence not required。
2. project-final activation 复用 `TK-715` clean 边界的 same-window 代码验证证据：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check`。
3. closeout 阶段补跑治理同步检查：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`。
