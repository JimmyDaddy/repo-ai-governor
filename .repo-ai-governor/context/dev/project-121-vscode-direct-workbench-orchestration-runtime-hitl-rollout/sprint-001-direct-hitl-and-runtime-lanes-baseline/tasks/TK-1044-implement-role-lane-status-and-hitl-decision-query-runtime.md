# TK-1044 implement role-lane status and hitl-decision query runtime

- Status: completed
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-001-direct-hitl-and-runtime-lanes-baseline`

## 1. 任务目标

在 core orchestration service 中实现 `role_lane_status / session_continuity / hitl_decision_packet` 的 query runtime、shell seam 与 sidecar exposure，使 direct-workbench runtime lanes 和 HITL cockpit 拥有真实 service-owned projection。

## 2. Depends On

1. `TK-1043`

## 3. 预期产物

1. direct-workbench query runtime 与 shell seam 增量
2. queue/runtime lane projection 与 decision-packet composition 增量
3. 面向 query runtime 的 targeted runtime coverage

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/TK-1043-extend-direct-workbench-runtime-dto-and-sidecar-contracts.md`
2. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
3. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`

## 6. 实施计划

1. 在 governance query/runtime layer 中新增 `queryRoleLaneStatus / querySessionContinuity / queryHitlDecisionPacket` 的 service-owned projection 组合逻辑。
2. 让 shell、sidecar host 与 sidecar client 暴露新 query，并保持 queue overview 与 execution board 的职责边界清晰。
3. 为 runtime lane status、decision packet 与 session continuity 的组装路径补齐 targeted runtime coverage。

## 7. Development Verification

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check:fast`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。
2. 2026-04-22：将 governance query runtime 扩展为 `queryRoleLaneStatus / querySessionContinuity / queryHitlDecisionPacket` 的聚合 facade，并继续复用 service-owned execution/session/review/artifact surfaces。
3. 2026-04-22：在 local orchestration service shell 中接入新 query seam，并补齐 runtime lane / continuity / decision packet 的 shell-level coverage。
4. 2026-04-22：执行 `pnpm run typecheck`、`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`。

## 10. 产出

1. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
4. `packages/core-orchestration-service/src/constants/local-orchestration-service-governance-query.constant.ts`
5. `packages/core-orchestration-service/src/constants/index.ts`
6. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
