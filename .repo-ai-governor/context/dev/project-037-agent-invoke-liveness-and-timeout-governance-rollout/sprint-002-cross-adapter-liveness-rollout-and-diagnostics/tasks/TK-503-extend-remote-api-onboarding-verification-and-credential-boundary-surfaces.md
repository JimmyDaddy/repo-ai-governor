# TK-503 extend remote-api onboarding verification and credential-boundary surfaces

- Status: planned
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-002-cross-adapter-liveness-rollout-and-diagnostics`

## 1. 任务目标

让 `connect / doctor / verify` 正式表达 remote-api candidate truth、credentialRef/provider-local read-only discovery 与 `next_action`，避免当前 baseline 只覆盖 env-based credential path。

## 2. Depends On

1. `TK-501`
2. `technical-solution.api-key-remote-adapter-invocation`
3. `apps/cli/src/runtime/adapter-verification-runtime.ts`
4. `packages/config/src/schema-validator.ts`

## 3. 预期产物

1. remote-api onboarding candidate truth
2. credentialRef / provider-local discovery read-only baseline
3. `next_action` / `next_actions[]` 补齐
4. transport/provider/binding-aware verification 输出
5. safe-local / manual-only boundary 证据

## 4. 实施计划

1. 为 connect/doctor/verify 引入 remote-api candidate config 与 deterministic vendor binding resolution。
2. 在不写 keychain / provider-owned config 的前提下补齐 credentialRef、env、provider-local 的 read-only discovery。
3. 将需要用户显式操作的场景 materialize 为 `next_action` / `next_actions[]`，而不是隐式修复。
4. 补齐 verification presenter / diagnostics 与定向测试。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `connect / doctor / verify remote_api` 相关定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；从 `TK-501` baseline 拆分 onboarding verification / credential boundary follow-through。
