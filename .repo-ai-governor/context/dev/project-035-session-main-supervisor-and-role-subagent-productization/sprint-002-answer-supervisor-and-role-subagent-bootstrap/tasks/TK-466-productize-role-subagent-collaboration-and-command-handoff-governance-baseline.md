# TK-466 productize role-subagent collaboration and command handoff governance baseline

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-002-answer-supervisor-and-role-subagent-bootstrap`

## 1. 任务目标

在 `session.main` supervisor bootstrap 之上补齐 single-role subagent path 与 command handoff governance baseline，让 connected roles 开始具备前台可协作的最小 runtime 语义。

## 2. Depends On

1. `TK-465`

## 3. 预期产物

1. `AgentDescriptor -> SessionMainSubagentDescriptor` 最小派生 seam
2. 一条可工作的 `session.main.role.<role-id>` 试点 path
3. `invokedRoleIds[] / subagentCount / interactionMode` 等最小协作 metadata
4. natural-language command handoff 的 preview + confirm governance baseline

## 4. 验证

1. `pnpm run build`
2. role-subagent / handoff 相关 regression tests
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`；第一阶段优先选择 single-role delegate 试点，不强行一次性交付 full multi-agent fan-out。
2. 2026-03-31：任务切换为 `active`；当前先收敛一条低风险、可显式触发的 role-subagent delegate path，优先保证 natural-language command handoff 继续服从 preview + confirm 治理边界。
3. 2026-03-31：已完成 `AgentDescriptor -> SessionMainSubagentDescriptor` 最小派生 seam、`@planner` single-role delegate 试点 path、`subagentCount` payload 回灌，以及“显式 role mention + connect-like intent 仍优先 handoff preview”的治理回归。
4. 2026-03-31：已通过 `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js` 验证。
5. 2026-03-31：为通过 full gate，补充拆分 `@repo-ai-governor/core-orchestration-service` 的 `constants/types` 子入口，避免 CLI help entrypoint 因根入口重导出 `LocalOrchestrationServiceShell` 而提前触发 `node:sqlite` experimental warning；随后已通过 `pnpm exec vitest run test/e2e/cli-help.e2e.test.ts --config vitest.e2e.config.ts` 与 `pnpm run check` 全量验证。
6. 2026-03-31：working-tree CR 已复核并收口；已修复 role delegate capability enforcement 缺口与 unknown `@mention` 误伤 `/plan` / `/review` handoff 的路由回归，并通过 targeted vitest、`pnpm run build`、`pnpm run check`。
