# TK-495 establish session.main capability descriptor seed-view contract and canonical catalog baseline

- Status: completed
- Date: 2026-04-03
- Owner: AI-Agent
- Priority: P1
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-001-capability-catalog-and-turn-outcome-foundation`

## 1. 任务目标

为 `session.main capability explainer` 冻结 locale-neutral seed / localized view contract、集中常量与 canonical catalog owner seam，确保 `runtime.orchestration` 成为 capability truth 的唯一正式拥有者。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-001-shared-liveness-contract-and-codex-watchdog-baseline/tasks/DA-494-session-main-capability-explainer-and-contextual-guidance-promotion-cutover.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
5. `packages/shared/src/i18n/i18n-runtime.ts`

## 3. 预期产物

1. `SessionMainCapabilityDescriptorSeed` / localized view / shared constants 的正式代码 contract
2. `core-orchestration-service` 内的 canonical `session-main-capability-catalog` seam
3. 与现有 `session.main` taxonomy、risk/confirmation 常量对齐的类型与说明

## 4. 实施计划

1. 将 capability descriptor 分解为 seed/view 两层，并沿用现有 `as const` 常量风格管理枚举语义。
2. 把 canonical catalog owner 约束在 `core-orchestration-service`，避免 `apps/cli` 或 presenter 层继续维护第二份 prose truth。
3. 为后续 help appendix、slash discoverability、explainer routing 和 shared session DTO 投影冻结统一字段。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-orchestration-service/test --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；等待 `project-038 / sprint-001` 激活后执行。
2. 2026-04-03：任务激活；开始冻结 `SessionMainCapabilityDescriptorSeed / localized view / canonical catalog` seam，并将 `project-038 / sprint-001` 升级为 primary stream。
3. 2026-04-03：已在 `core-orchestration-service` 落地 `SESSION_MAIN_CAPABILITY_ID / ANSWER_KIND` 常量、`SessionMainCapabilityDescriptorSeed / View` 契约与 `LocalOrchestrationServiceSessionMainCapabilityCatalog`，并将 `LocalOrchestrationServiceSessionMainSkillRegistry` 切到 canonical catalog truth。
4. 2026-04-03：补齐 `sessionMainCapabilities.catalog.*` shared i18n keys 和 package 级 unit tests，确认 localized descriptor view 与 governed capability metadata 能从单一 orchestration-owned seed 渲染。
5. 2026-04-03：验证通过 `pnpm exec vitest run packages/core-orchestration-service/test --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`check-i18n-parity-fallback`、`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`pnpm run check`、`pnpm run build`；`pnpm -s tsc -p tsconfig.json --noEmit` 仍暴露仓库内既有、与 `TK-495` 无关的测试面 type drift，不作为本次 baseline 回退依据。
