# TK-1049 implement richer graph editing and projection-backed workflow studio

- Status: in_progress
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-003-richer-graph-editing-and-support-truth-readiness`

## 1. 任务目标

补齐 projection-backed richer graph editing、runtime stage navigation 与 backlink reveal 的代码路径，让 Workflow Studio 在 VS Code 中具备更强 direct-workbench graph interaction，同时保持 graph/runtime truth 继续由 service 持有。

## 2. Depends On

1. `TK-1040`

## 3. 预期产物

1. richer graph editing 与 workflow studio projection 增量
2. runtime stage navigation / backlink reveal 增量
3. 面向 graph interaction 的 targeted smoke/regression coverage

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks/TK-1040-close-sprint-002-and-hand-off-richer-graph-editing-readiness.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
3. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
5. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`

## 5. Traceback References

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 6. 实施计划

1. 扩展 workflow studio snapshot/presentation，使其展示 graph nodes/edges、runtime stage progress 与 backlinks 的 service-backed projection。
2. 让 graph edit intents 继续走 draft-session/runtime seam，而不是在 extension 内部持久化第二套 graph truth。
3. 为 node/edge interaction、runtime stage navigation 与 backlink reveal 补齐 targeted smoke/regression coverage。

## 7. Development Verification

1. `pnpm run typecheck`
2. `pnpm run check:ide-entry-smoke`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check:desktop-entry-smoke`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。
2. 2026-04-23：随 `TK-1040` 完成 sprint-002 closeout，当前任务切换为 `in_progress`，开始实现 Workflow Studio richer graph editing、runtime stage navigation 与 backlink reveal 的 direct-workbench code path。

## 10. 产出

1. 待执行：`apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
2. 待执行：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
3. 待执行：`apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
