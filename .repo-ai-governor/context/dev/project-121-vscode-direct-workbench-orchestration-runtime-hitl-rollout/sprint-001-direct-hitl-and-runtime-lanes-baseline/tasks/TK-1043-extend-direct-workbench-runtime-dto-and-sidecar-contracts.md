# TK-1043 extend direct-workbench runtime dto and sidecar contracts

- Status: completed
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-001-direct-hitl-and-runtime-lanes-baseline`

## 1. 任务目标

为 `queryRoleLaneStatus / querySessionContinuity / queryHitlDecisionPacket` 补齐 direct-workbench 的 service/client/sidecar DTO 与操作契约，使后续 query runtime 与 vscode surface 可以消费稳定 payload。

## 2. Depends On

1. `TK-1037`
2. `contract.runtime.direct-workbench-orchestration-runtime-hitl.v1`

## 3. 预期产物

1. `packages/orchestration-service-client` 的 direct-workbench query DTO / interface 增量
2. `packages/core-orchestration-service` 的 sidecar constant / interface / client / host dispatch 增量
3. 面向新 DTO 的 contract/type coverage

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/DA-1037-vscode-direct-workbench-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
3. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
4. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
5. `packages/core-orchestration-service/src/constants/local-orchestration-service-sidecar.constant.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-direct-workbench-authoring-runtime-lanes-and-hitl-decision-cockpit.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 6. 实施计划

1. 定义 `queryRoleLaneStatus / querySessionContinuity / queryHitlDecisionPacket` 的 request/response DTO、client method signature 与 capability vocabulary。
2. 扩展 sidecar operation constants、dispatch table、client 与 host bridge，使新 query 可以端到端透传。
3. 为 risk facts、SLA、default timeout action 与 backlink 字段补齐 contract/type coverage。

## 7. Development Verification

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check:fast`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。
2. 2026-04-22：为 orchestration service client 新增 `role_lane_status / session_continuity / hitl_decision_packet` DTO、query request/response 与 `workbench backlink / risk fact` vocabulary。
3. 2026-04-22：扩展 sidecar operation constants、dispatch table、client 与 host，使 `queryRoleLaneStatus / querySessionContinuity / queryHitlDecisionPacket` 可以经由 sidecar 端到端透传。
4. 2026-04-22：执行 `pnpm run typecheck`、`pnpm run build` 与 targeted vitest，确认 contract 增量与 sidecar wiring 可编译可回归。

## 10. 产出

1. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
2. `packages/orchestration-service-client/src/types/interfaces/index.ts`
3. `packages/orchestration-service-client/src/types/index.ts`
4. `packages/orchestration-service-client/src/index.ts`
5. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
6. `packages/core-orchestration-service/src/constants/local-orchestration-service-sidecar.constant.ts`
7. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
8. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
