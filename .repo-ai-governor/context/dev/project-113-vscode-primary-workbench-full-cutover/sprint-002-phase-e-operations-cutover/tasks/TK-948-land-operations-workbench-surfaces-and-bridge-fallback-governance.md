# TK-948 land operations workbench surfaces and bridge fallback governance

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-002-phase-e-operations-cutover`

## 1. 任务目标

在 VS Code primary workbench 内收口 operations surface、bridge fallback governance 与 operator continuity UX。

## 2. Depends On

1. implement service-native operations seams and receipts

## 3. 预期产物

1. operations workbench surface artifact for TK-948
2. task card update for TK-948
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. apps/vscode-extension/README.md
2. docs/support-matrix.zh-CN.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md
2. .repo-ai-governor/context/dev/project-097-cli-exec-runtime-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-819-cli-exec-runtime-promotion-and-rollout-decomposition-handoff.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks" --task-id TK-948

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks" --task-id TK-948
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks" --task-id TK-948
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始把 review detail / workflow studio 的 restore failure 从抛错或无限 loading 收敛到可恢复的 degraded service-backed page。
3. 2026-04-17：`VsCodeExtensionPresentationBuilder` 已新增通用 `buildServiceFailureHtml()`，review detail 与 workflow studio provider 均改为捕获 restore 异常并渲染 degraded page；controller/provider 定向测试已补齐对应 failure-state coverage，同窗口 `pnpm run build` 与 2 个 VS Code extension 定向 vitest 已通过，当前任务切换为 `completed`。
4. 2026-04-17：`CR-001` accepted finding 已把 artifact-pane restore failure 调整为由 runtime 显式抛给 provider degraded path，而不再伪装成“未选中执行”的假空态；同窗口 `pnpm run build` 与定向 vitest 已重跑通过。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`vscode-extension-review-detail-provider.ts` 与 `vscode-extension-workflow-studio-provider.ts` 已完成 degraded failure surface 收口；artifact-pane restore failure 现在不会再被错误投影为“未选中执行”空态。
2. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts` 已补齐 review detail / workflow studio restore failure 的 degraded render coverage。
