# TK-512 add continuation invalidation stateless-retry and resume fallback regression coverage

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`
- Sprint: `sprint-002-summary-projection-and-provider-readiness-governance`

## 1. 任务目标

为 continuation rollout 建立回归矩阵，覆盖 invalidation、single stateless retry、surface fallback、resume parity 与 provider invalid-handle clear，确保 provider-native reuse 始终受 shared session truth 约束。

## 2. Depends On

1. `TK-509`
2. `TK-510`
3. `TK-511`
4. `packages/core-session/src/shared-session-manager.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
6. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`

## 3. 预期产物

1. continuation invalidation regression matrix
2. single stateless retry baseline
3. surface fallback / resume parity coverage
4. guardrail against provider truth overriding shared-session truth

## 4. 实施计划

1. 为 model/policy/surface/workspace drift、invalid handle、resume 恢复与 fallback 切换补齐定向测试。
2. 验证 clear-slot 后最多只发生一次 stateless retry，且不会把旧 handle 迁移到新 surface/lane。
3. 将 regression evidence 回写到 sprint ledger，形成后续 provider adoption 的最低治理门槛。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `core-session / core-orchestration-service / apps/cli` continuation regression 测试集合

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 continuation invalidation、retry 与 resume/fallback coverage 的统一收口。
2. 2026-04-04：任务完成：已补齐 continuation `created -> reused -> refreshed`、shared-session persistence、resumed-turn reload、session.main continuation request/summary 与 transcript projection 回归，形成 rollout regression baseline。
3. 2026-04-04：CR 修复追加收口：新增锁内 latest-context merge seam 与跨 manager 回归，确认 `providerContinuations` 的 sibling slot merge 基于持锁时的最新 context，而不是 turn 开始时的旧快照。
