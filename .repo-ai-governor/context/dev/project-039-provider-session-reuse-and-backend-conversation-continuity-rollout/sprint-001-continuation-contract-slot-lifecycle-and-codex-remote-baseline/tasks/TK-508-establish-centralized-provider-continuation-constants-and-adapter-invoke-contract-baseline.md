# TK-508 establish centralized provider continuation constants and adapter invoke contract baseline

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-039-provider-session-reuse-and-backend-conversation-continuity-rollout`
- Sprint: `sprint-001-continuation-contract-slot-lifecycle-and-codex-remote-baseline`

## 1. 任务目标

为 active formal solution `technical-solution.provider-session-reuse-and-backend-conversation-continuity` 冻结 continuation contract baseline：集中管理 `mode / status / transportKind / handleKind` 等闭集语义，扩展 adapter invoke/stream request-result seam，并明确 `sessionId` 只用于 trace/logging，不进入 provider continuation identity。

## 2. Depends On

1. `technical-solution.provider-session-reuse-and-backend-conversation-continuity`
2. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-001-capability-catalog-and-turn-outcome-foundation/tasks/DA-507-provider-session-reuse-and-backend-conversation-continuity-technical-solution-promotion.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/provider-session-reuse-and-continuation-handle-seam.md`
5. `packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts`

## 3. 预期产物

1. `adapter-sdk` continuation constants owner seam
2. `AgentStageContinuationRequest / Result` 正式 contract
3. invoke/stream additive continuation 字段基线
4. `sessionId trace-only` compatibility note 的实现对齐

## 4. 实施计划

1. 将 continuation 闭集值集中到 `packages/adapter-sdk/src/constants`，避免 provider/runtime 再次各写一套 inline literal。
2. 在 adapter invoke/stream seam 上补齐 continuation request/result，并保持 additive backward compatibility。
3. 为 `sessionId` 补充 trace-only boundary，确保它不会被塞进 `laneKey`、slot key 或 provider continuation identity。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `adapter-sdk / projection contract` 相关定向测试集合

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；由 `DA-507` 的 delivery handoff 建立。
2. 2026-04-04：任务激活；开始在 `adapter-sdk` 冻结 continuation constants、request/result contract 与 `sessionId` trace-only boundary，并准备同步 `apps/cli` / adapters 的 request wiring。
3. 2026-04-04：任务完成：`packages/adapter-sdk` 已新增 continuation 常量集、opaque `ProviderContinuationHandle`、invoke/stream additive continuation seam，并通过定向回归与 `pnpm run build`。
