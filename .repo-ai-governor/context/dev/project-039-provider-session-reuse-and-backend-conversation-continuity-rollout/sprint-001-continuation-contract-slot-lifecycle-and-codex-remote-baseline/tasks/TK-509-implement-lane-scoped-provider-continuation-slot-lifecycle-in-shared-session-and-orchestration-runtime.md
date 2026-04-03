# TK-509 implement lane-scoped provider continuation slot lifecycle in shared session and orchestration runtime

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`
- Sprint: `sprint-001-continuation-contract-slot-lifecycle-and-codex-remote-baseline`

## 1. 任务目标

在 shared session truth 下正式引入 `providerContinuations` slot state、`laneKey` derivation、slot-aware mutation 与 invalidation baseline，让 `runtime.orchestration` 持有 provider continuation lifecycle，而不解析 provider-private handle 语义。

## 2. Depends On

1. `TK-508`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
4. `packages/core-session/src/shared-session-manager.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
6. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`

## 3. 预期产物

1. `providerContinuations` session context state baseline
2. lane-scoped slot lifecycle 与 invalidation rule
3. slot-aware runtime mutation/read path
4. turn-level presenter-safe continuation summary seed

## 4. 实施计划

1. 在 `core-session` 中补齐 continuation slot state 读写 seam，保持 shared session 作为 canonical truth。
2. 在 `core-orchestration-service` 与 `session-main-supervisor-runtime` 中计算 `laneKey`，并把 continuation request/summary 贯通到 turn runtime。
3. 冻结 slot invalidation baseline：provider/surface/transport/model/policy/workspace 变化与 invalid handle 都必须触发 clear-or-do-not-reuse。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `core-session / core-orchestration-service / session-main` 相关定向测试集合

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；等待 `TK-508` 冻结 continuation contract 后执行。
2. 2026-04-04：任务完成：`providerContinuations` session context、lane-scoped slot mutation、pre-dispatch invalidation、resume reload 与 turn-level presenter-safe summary seed 已贯通到 `core-orchestration-service` / `apps/cli`，并通过定向回归与 `pnpm run build`。
