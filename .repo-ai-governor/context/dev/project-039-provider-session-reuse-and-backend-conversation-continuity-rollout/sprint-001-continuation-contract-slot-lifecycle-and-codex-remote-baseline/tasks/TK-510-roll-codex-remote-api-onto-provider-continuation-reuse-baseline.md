# TK-510 roll codex remote api onto provider continuation reuse baseline

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`
- Sprint: `sprint-001-continuation-contract-slot-lifecycle-and-codex-remote-baseline`

## 1. 任务目标

让 `Codex remote API` 成为第一条正式 provider continuation implementation path：支持 continuation request/result、shared-session slot persistence、invalid-handle clear 与至多一次 stateless retry，而不是继续把 `threadId` 当作 output 自由字段线索。

## 2. Depends On

1. `TK-508`
2. `TK-509`
3. `technical-solution.api-key-remote-adapter-invocation`
4. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/TK-501-roll-out-api-key-remote-adapter-invocation-runtime-transport-and-delivery-verification.md`
5. `packages/adapters/codex/src/codex-agent-adapter.ts`

## 3. 预期产物

1. `Codex remote API` continuation request/result reuse baseline
2. `created / reused / cleared / unsupported` 的正式状态闭环
3. invalid handle clear + stateless retry baseline
4. 与 shared-session slot lifecycle 的稳定接缝

## 4. 实施计划

1. 在 Codex remote path 上把 continuation handle 从 runtime request 映射到 provider continuation 请求载荷。
2. 让 adapter 只通过显式 continuation result 认定 reuse 是否成立，并把新 handle 回写给 shared-session slot owner。
3. 对 invalid / expired / not_found 一类 provider 错误执行 clear + single stateless retry，防止 runtime 卡死在 require-reuse 假设上。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `codex remote_api / orchestration continuation` 相关定向测试集合

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；作为 phase-A provider continuation rollout 的首条正式实现任务。
2. 2026-04-04：任务完成：Codex remote path 已把 continuation handle 映射到 OpenAI Responses `previous_response_id`，并补齐 `created / reused / refreshed` 生命周期、invalid-handle clear + single stateless retry 与 smoke/regression/build 证据。
