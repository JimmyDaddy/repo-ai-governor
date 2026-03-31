# checklist

- [x] TK-465 bootstrap service-owned session.main supervisor and direct answer path
  - 2026-03-31：任务创建，状态初始化为 `planned`；承接 `session.main` 从 metadata recap router 走向真实 answer path 的 Phase A bootstrap。
  - 2026-03-31：`sprint-002` 已激活，`TK-465` 切换为 `active`；当前开始梳理 `session.main` runtime / dispatcher / transcript consumer seam，并准备落 direct answer bootstrap。
  - 2026-03-31：已完成 `SessionMainSupervisorRuntimeContract`、service-owned direct answer seam、`interactionMode / selectedSurface / selectedBy / invokedRoleIds` payload 回灌，以及 CLI embedded-shell wiring。
  - 2026-03-31：已通过 `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`、`pnpm run build`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js` 验证。
  - 2026-03-31：已按 working-tree CR 修复 direct-answer governance bypass；新增 no-tool hard guard、安全 fallback 与 governed fallback 回归，并再次通过 targeted vitest + `pnpm run build` + task/sprint ledger gate。

- [x] TK-466 productize role-subagent collaboration and command handoff governance baseline
  - 2026-03-31：任务创建，状态初始化为 `planned`；在 `TK-465` 之后补齐一条可工作的 role-subagent path 与 command handoff governance baseline。
  - 2026-03-31：任务已切换为 `active`；当前优先实现一条显式 role delegate 试点，并保持 command keyword 仍走已有 preview + confirm handoff。
  - 2026-03-31：已完成 `@planner` single-role delegate 试点、`AgentDescriptor -> SessionMainSubagentDescriptor` seam、`subagentCount` shared session metadata，以及 role mention 不突破 connect-like handoff 治理边界的回归。
  - 2026-03-31：已通过 `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js` 验证。
  - 2026-03-31：为通过 full gate，补齐 `core-orchestration-service/constants` 与 `core-orchestration-service/types` 子入口，避免 CLI help 因根入口重导出 shell 而提前触发 `node:sqlite` warning；随后已通过 `pnpm exec vitest run test/e2e/cli-help.e2e.test.ts --config vitest.e2e.config.ts` 与 `pnpm run check`。
  - 2026-03-31：已按 pending CR 修复 role delegate capability contract 漏接与 unknown `@mention` 误伤 `plan/review` handoff 的问题；resolved CR 已落档，并再次通过 targeted vitest、`pnpm run build`、`pnpm run check`。
