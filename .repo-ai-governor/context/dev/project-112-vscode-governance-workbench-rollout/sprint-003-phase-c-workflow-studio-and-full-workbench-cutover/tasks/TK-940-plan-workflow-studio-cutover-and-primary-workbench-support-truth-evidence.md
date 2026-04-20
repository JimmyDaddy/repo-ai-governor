# TK-940 plan workflow studio cutover and primary workbench support-truth evidence

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P1
- Project: `project-112-vscode-governance-workbench-rollout`
- Sprint: `sprint-003-phase-c-workflow-studio-and-full-workbench-cutover`

## 1. 任务目标

规划 workflow studio、desktop decision surface 与 support-truth evidence 的正式 cutover 路径

## 2. Depends On

1. DA-934

## 3. 预期产物

1. workflow studio and support-truth cutover artifact for TK-940
2. task card update for TK-940
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/context/current-context.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. pnpm run build
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/tasks" --task-id TK-940

## 8. Delivery Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. pnpm run build
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/tasks" --task-id TK-940
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/tasks" --task-id TK-940
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-16：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 sprint-002 在 latest fresh reviewer clean round `CR-012` 与 `DA-939` handoff 后完成 closeout，当前任务已切换为 `in_progress`，开始承接 workflow studio、desktop decision surface 与 support-truth evidence 的 Phase C 实施。
3. 2026-04-17：已完成 Phase C implementation boundary：新增 VS Code `workflow studio` webview、workflow-studio snapshot resolver、desktop decision surface / support-truth gate evidence rendering，并保持 public support level 仍为 `workbench_baseline_in_progress` 直到最终证据窗口明确放行；当前任务切换为 `completed`，进入 fresh reviewer CR loop 前置验证窗口。
4. 2026-04-17：已通过 Phase C targeted vitest bundle 与同窗口 `pnpm run build`，当前实现边界已具备进入 delegated reviewer round 的条件。

## 10. 产出

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/tasks/DA-940-workflow-studio-desktop-decision-and-support-truth-evidence.md
2. /Users/jimmydaddy/study/ai-governor/apps/vscode-extension/package.json
3. /Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-host.ts
4. /Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts
5. /Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts
6. /Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts
