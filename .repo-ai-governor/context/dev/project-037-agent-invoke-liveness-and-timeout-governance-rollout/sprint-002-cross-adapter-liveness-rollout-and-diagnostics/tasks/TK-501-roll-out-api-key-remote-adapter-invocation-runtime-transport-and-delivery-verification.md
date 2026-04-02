# TK-501 roll out api-key remote adapter invocation runtime transport and delivery verification

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-002-cross-adapter-liveness-rollout-and-diagnostics`

## 1. 任务目标

为 active formal solution `technical-solution.api-key-remote-adapter-invocation` 落地第一阶段 runtime baseline：交付 transport-aware routing、Codex/Claude remote_api probe+invoke baseline，以及 transport/provider/binding-aware health truth；其余 follow-through 由拆分任务承接。

## 2. Depends On

1. `technical-solution.api-key-remote-adapter-invocation`
2. `DA-500`
3. `TK-486`
4. `packages/adapter-sdk/src/constants/agent-cli-exec.constant.ts`
5. `packages/adapter-sdk/src/types/interfaces/agent-cli-exec.interface.ts`
6. `packages/adapters/codex/src/codex-agent-adapter.ts`
7. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
8. `apps/cli/src/runtime/adapter-routing-runtime.ts`

## 3. 预期产物

1. transport-aware routing baseline
2. `codex -> remote_api -> openai_responses` rollout seam
3. `claude-code -> remote_api -> anthropic_messages` rollout seam
4. transport/provider/binding-aware health truth baseline
5. 后续 `TK-502` / `TK-503` / `TK-504` 的清晰拆分边界

## 4. 实施计划

1. 在 adapter-sdk / adapters / CLI routing 之间落 transport-neutral contract 与 colocated vendor binding seam。
2. 让 `connect / doctor / verify`、route probe 与 `AgentDescriptor` 正式输出 transport / provider / binding-aware 事实。
3. 修复 baseline 上发现的 timeout budget 与 credential truth drift，确保 remote-api runtime contract 不回退。
4. 将 streaming liveness、onboarding/credential boundary、delivery verification 分别拆到 `TK-502`、`TK-503`、`TK-504`，由后续任务独立承接。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `adapter routing + codex/claude remote_api` 相关定向测试集合

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；由 `TK-500` 的 delivery handoff 建立。
2. 2026-04-02：完成 runtime baseline 第一段：新增 remote-api config/schema、routing transport 选择、Codex -> OpenAI Responses / Claude Code -> Anthropic Messages 的 probe+invoke baseline，以及 transport/provider/binding-aware health truth 透传到 adapter verification。
3. 2026-04-02：本任务剩余范围已拆分到 `TK-502`（streaming liveness / execution diagnostics）、`TK-503`（onboarding verification / credential boundary）、`TK-504`（delivery verification / clean-room smoke）；拆分后这些余项不再由 `TK-501` 持有。
4. 2026-04-02：根据 `working-tree` CR 修复 remote-api timeout/credential boundary 回归：Codex / Claude remote retry 改为共享总 timeout budget 且 `AbortError` 不再重试；`credentialRef` 在 schema 与 runtime 均改为 fail-closed，并补齐回归测试与 build 验证。
5. 2026-04-02：任务收口并标记为 `completed`；`TK-501` 仅代表 remote-api runtime baseline，后续工作继续由 `TK-502`、`TK-503`、`TK-504` 独立推进。
