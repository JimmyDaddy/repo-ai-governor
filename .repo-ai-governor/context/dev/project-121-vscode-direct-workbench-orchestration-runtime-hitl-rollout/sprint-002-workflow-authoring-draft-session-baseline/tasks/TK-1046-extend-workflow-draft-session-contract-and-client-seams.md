# TK-1046 extend workflow draft-session contract and client seams

- Status: completed
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-002-workflow-authoring-draft-session-baseline`

## 1. 任务目标

为 `workflow_draft_session`、revision token、base definition revision、supported patch ops 与 conflict state 补齐 direct-workbench authoring 的 service/client/sidecar seam，使 VS Code 可以通过稳定 API 驱动工作流草稿会话。

## 2. Depends On

1. `TK-1038`
2. `contract.runtime.direct-workbench-orchestration-runtime-hitl.v1`

## 3. 预期产物

1. workflow draft-session DTO / interface / mutation contract 增量
2. sidecar operation 和 client seam 增量
3. 面向 draft-session contract 的 type/contract coverage

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/DA-1037-vscode-direct-workbench-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
3. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
4. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
5. `packages/core-orchestration-service/src/constants/local-orchestration-service-sidecar.constant.ts`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-direct-workbench-authoring-runtime-lanes-and-hitl-decision-cockpit.md`
2. `.repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/plan.md`

## 6. 实施计划

1. 扩展 orchestration service client 与 sidecar contract，使 `workflow_draft_session` 及其 mutation request/response 拥有稳定 DTO。
2. 明确 revision token、base definition revision、conflict state 与 supported patch ops 的字段语义和生命周期边界。
3. 为 draft-session contract 补齐 targeted type/contract coverage，避免 extension 或 service 再次退回 CLI-only authoring seam。

## 7. Development Verification

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check:fast`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。
2. 2026-04-22：开始实现 `workflow_draft_session` contract 与 sidecar seam，任务切换为 `in_progress`。
3. 2026-04-22：已补齐 orchestration-service-client DTO / export、sidecar operation / dispatch contract 与 direct workflow draft seam，并通过 `pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:fast`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`。

## 10. 产出

1. 已完成：`packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
2. 已完成：`packages/orchestration-service-client/src/index.ts`
3. 已完成：`packages/orchestration-service-client/src/types/index.ts`
4. 已完成：`packages/orchestration-service-client/src/types/interfaces/index.ts`
5. 已完成：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
6. 已完成：`packages/core-orchestration-service/src/constants/local-orchestration-service-sidecar.constant.ts`
7. 已完成：`packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
