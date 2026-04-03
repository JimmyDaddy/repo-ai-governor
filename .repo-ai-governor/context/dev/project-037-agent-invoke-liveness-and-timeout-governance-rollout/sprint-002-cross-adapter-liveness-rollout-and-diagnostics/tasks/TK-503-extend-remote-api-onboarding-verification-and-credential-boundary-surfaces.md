# TK-503 extend remote-api onboarding verification and credential-boundary surfaces

- Status: completed
- Date: 2026-04-03
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
2. 2026-04-03：任务激活，先完成第一段 safe-local onboarding/verification 收口：`connect / doctor / verify` 现在会把 remote-api `tool_transport_matrix`、candidate config truth 与 probe truth 写入 onboarding / verify payload；`credential_missing:<surface>:<envVar>` 细节不再在 layered health-check 中丢失，`next_actions` 会优先产出更具体的 remote-api env/provider-local/credentialRef manual guidance；定向 vitest 与 `pnpm run build` 已通过。
3. 2026-04-03：完成 schema/runtime discovery 收口：`remoteApi.credentialRef` 与 `allowProviderLocalConfig` 进入正式 config truth，Codex probe 会把 `credentialRef` materialize 为 manual-only `credential_source=credential_ref`，Claude Code 会在显式开启时只读解析官方 `~/.claude/settings.json` / `.claude/settings*.json` 中的 provider-local `ANTHROPIC_API_KEY` 与 `ANTHROPIC_BASE_URL`，并将其投影为 `credential_source=provider_local` / `endpoint_source=provider_local`；新增 config、CLI runtime、Codex、Claude Code 定向回归，`pnpm run build`、`check-task-ledger-sync`、`check-sprint-plan-status-sync` 通过，任务标记 `completed`。
