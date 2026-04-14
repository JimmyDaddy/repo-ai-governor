# TK-883 project acp_host_companion carrier without polluting session or continuation canonical truth

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-001-acp-host-facing-transport-rollout`

## 1. 任务目标

把 `acp_host_companion` 作为 projection-owned carrier 落到真实 implementation boundary，同时保持 session/continuation canonical truth 不被 ACP-local ids 污染。

## 2. Depends On

1. `TK-882`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 3. 预期产物

1. acp_host_companion carrier plan
2. session/continuation isolation boundary
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-105-acp-host-facing-transport-rollout/sprint-001-acp-host-facing-transport-rollout/tasks/TK-882-implement-explicit-acp-exec-transport-routing-and-fail-closed-separation-from-cli-exec.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/review/solution_review_acp-host-facing-transport-formalization.md`

## 6. 实施计划

1. 固定 `acp_host_companion` 的 carrier responsibility 与 presenter-safe facts。
2. 保持 ACP-local ids 不回写 shared session truth 或 continuation truth。
3. 为 `TK-884` closeout/activation handoff 准备清晰 evidence boundary。

## 7. Development Verification

1. `pnpm exec vitest run packages/core-agent-projection/test/agent-projection-service.unit.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-15：已将 `acp_host_companion` 正式接入 `AgentDescriptor` additive carrier，并在 projection runtime 中为 `acp_exec` 提供稳定的 `hostReadinessStatus / distributionBoundary / companionStateSummary` companion；同时 provider continuation seam 对 `acp_exec` fail-closed 返回 `null`，确保 ACP-local truth 不污染 shared session / continuation canonical state。focused projection suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 已通过，当前任务完成。

## 10. 产出

1. `packages/core-agent-projection/src/types/interfaces/agent-projection.interface.ts`
2. `packages/core-agent-projection/src/agent-projection-service.ts`
3. `apps/cli/src/runtime/agent-projection-runtime.ts`
4. `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
5. `packages/core-agent-projection/test/agent-projection-service.unit.test.ts`
6. `apps/cli/test/runtime/agent-projection-runtime.test.ts`
7. `apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
