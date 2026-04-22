# TK-1047 implement draft-session mutation runtime and replace cli workflow bridge

- Status: planned
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-002-workflow-authoring-draft-session-baseline`

## 1. 任务目标

在 core orchestration service 中落地 workflow draft-session 的 create/edit/preview/mutate runtime，并让 workflow 操作从 CLI workspace-operation bridge 优先路径切换到 direct-workbench service seam。

## 2. Depends On

1. `TK-1046`

## 3. 预期产物

1. draft-session mutation runtime 与 shell seam 增量
2. 替代 CLI workflow bridge 的 sidecar/service entrypoint
3. 面向 revision/conflict path 的 targeted runtime coverage

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks/TK-1046-extend-workflow-draft-session-contract-and-client-seams.md`
2. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`

## 5. Traceback References

1. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`

## 6. 实施计划

1. 为 workflow draft-session 新增 service-owned create/edit/preview/mutate runtime，返回结构化 revision/conflict payload。
2. 调整 shell、sidecar host 与 sidecar client 的入口，让 workflow 操作不再只依赖 CLI workspace-operation bridge。
3. 为 draft-session mutation、preview 与 conflict-safe patch path 补齐 targeted runtime coverage。

## 7. Development Verification

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check:fast`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
2. 待执行：`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
3. 待执行：`packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
