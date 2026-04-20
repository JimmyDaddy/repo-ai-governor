# TK-947 implement service-native operations seams and receipts

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-002-phase-e-operations-cutover`

## 1. 任务目标

补齐 service-native operations seam、receipt/backlink 与 bridge minimization baseline。

## 2. Depends On

1. freeze phase-e operations cutover and bridge-exit criteria

## 3. 预期产物

1. operations service seam artifact for TK-947
2. task card update for TK-947
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md
2. .repo-ai-governor/context/dev/project-097-cli-exec-runtime-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-819-cli-exec-runtime-promotion-and-rollout-decomposition-handoff.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/plan.md

## 5. Traceback References

1. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks" --task-id TK-947

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks" --task-id TK-947
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks" --task-id TK-947
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始将 Phase E sidecar/query restore failure 收敛到 service-native empty response / undefined fallback，而不是让 provider 侧承受未处理异常。
3. 2026-04-17：`VsCodeExtensionServiceRuntime` 已补齐 execution board / HITL inbox / queue overview 的 empty DTO fallback，以及 execution lookup 的 catch-and-return-undefined 语义；同窗口 `pnpm run build` 与 2 个 VS Code extension 定向 vitest 已通过，当前任务切换为 `completed`。
4. 2026-04-17：`CR-001` accepted finding 已补齐 `queryHitlInbox()` 的 reject-path 回归覆盖，并把 artifact-pane restore failure 从 runtime swallow 调整为显式交给 provider degraded surface 处理；同窗口 `pnpm run build` 与定向 vitest 已重跑通过。

## 10. 产出

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts` 已冻结 Phase E service-native fallback seam，使 execution board / HITL inbox / queue overview restore 失败时回到 empty DTO，execution lookup 失败时回到 `undefined`，而 artifact-pane restore failure 会显式交给 provider degraded surface 处理。
2. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts` 已补齐 queue overview / execution board / HITL inbox packaged-sidecar failure 覆盖，并锁定 artifact-pane restore failure 会把 review-detail / workflow-studio snapshot 推入 degraded 路径。
