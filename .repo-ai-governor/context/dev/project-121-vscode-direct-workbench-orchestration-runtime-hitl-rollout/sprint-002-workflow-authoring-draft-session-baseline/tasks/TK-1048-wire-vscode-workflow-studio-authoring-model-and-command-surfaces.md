# TK-1048 wire vscode workflow studio authoring model and command surfaces

- Status: completed
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-002-workflow-authoring-draft-session-baseline`

## 1. 任务目标

让 VS Code Workflow Studio 通过 draft-session API 直接创建、编辑、预览工作流，并把命令控制器与 authoring presentation 从 CLI bridge-first 路径切换到 service-owned authoring seam。

## 2. Depends On

1. `TK-1047`

## 3. 预期产物

1. vscode workflow authoring runtime 与 command surface 增量
2. workflow studio provider / presentation builder 的 authoring state 增量
3. 面向 authoring surface 的 targeted smoke/regression coverage

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks/TK-1047-implement-draft-session-mutation-runtime-and-replace-cli-workflow-bridge.md`
2. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
5. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`

## 5. Traceback References

1. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
2. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 6. 实施计划

1. 在 extension service runtime 与 command controller 中新增 direct draft-session create/edit/preview/mutate 消费路径。
2. 更新 workflow studio provider 与 presentation builder，使其渲染 service-owned authoring state、revision token 与 conflict state。
3. 为 workflow authoring surface 补齐 targeted smoke/regression coverage，并保持 graph 仍是 projection 而非 extension 本地 canonical source。

## 7. Development Verification

1. `pnpm run typecheck`
2. `pnpm run check:ide-entry-smoke`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check:desktop-entry-smoke`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。
2. 2026-04-22：已把 VS Code workflow preview/create/edit 切换到 direct draft-session authoring，并新增 mutate / validate / commit command surface、workflow studio authoring state 渲染与 quick-input based schema-first mutation baseline。
3. 2026-04-22：已通过 `pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`。

## 10. 产出

1. 已完成：`apps/vscode-extension/src/constants/vscode-extension.constant.ts`
2. 已完成：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
3. 已完成：`apps/vscode-extension/src/runtime/vscode-extension-host.ts`
4. 已完成：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
5. 已完成：`apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`
6. 已完成：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
7. 已完成：`apps/vscode-extension/src/types/index.ts`
8. 已完成：`apps/vscode-extension/src/types/interfaces/index.ts`
9. 已完成：`apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
10. 已完成：`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
11. 已完成：`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
