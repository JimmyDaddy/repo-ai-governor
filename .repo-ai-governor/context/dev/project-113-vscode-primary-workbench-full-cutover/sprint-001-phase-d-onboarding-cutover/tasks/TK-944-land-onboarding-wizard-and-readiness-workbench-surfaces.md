# TK-944 land onboarding wizard and readiness workbench surfaces

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-001-phase-d-onboarding-cutover`

## 1. 任务目标

在 VS Code primary workbench 内收口 onboarding wizard、readiness diagnostics 与 guided action surface。

## 2. Depends On

1. implement onboarding aggregation facade and diagnostics seams

## 3. 预期产物

1. onboarding workbench surface artifact for TK-944
2. task card update for TK-944
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. apps/vscode-extension/README.md
2. docs/local-adoption-playbook.zh-CN.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md
2. docs/support-matrix.zh-CN.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-944

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-944
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-001-phase-d-onboarding-cutover/tasks" --task-id TK-944
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：当前任务切换为 `in_progress`，开始验证 chat API 缺失时 VS Code primary workbench 的基础 surface 仍能完成 activation，并保持 command / tree view / webview provider 注册。
3. 2026-04-17：已新增 `apps/vscode-extension/test/vscode-extension-host.activation.test.ts`，覆盖 `vscode.chat` 不可用时的 host activation regression，确认 `repoAiGovernor.refresh`、review detail 打开命令、tree view 与 webview view provider 仍完成注册。
4. 2026-04-17：已完成 `pnpm run build` 与 VS Code extension 的 3 个定向 vitest，确认 workbench surface regression 已被锁进测试窗口；当前任务切换为 `completed`。

## 10. 产出

1. `apps/vscode-extension/test/vscode-extension-host.activation.test.ts` 已新增 Phase D activation regression，用于验证无 chat API 场景下的核心 workbench surface 可用性。
2. `apps/vscode-extension/src/runtime/vscode-extension-host.ts` 的 wiring 已保持 tree views、webview providers、code actions 与 refresh/openReviewDetail 等命令在 chat 缺失时仍完成注册。
