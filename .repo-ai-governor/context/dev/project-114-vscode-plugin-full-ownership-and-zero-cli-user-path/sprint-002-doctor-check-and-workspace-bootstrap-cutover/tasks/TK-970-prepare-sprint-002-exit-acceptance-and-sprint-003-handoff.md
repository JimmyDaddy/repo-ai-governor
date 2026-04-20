# TK-970 prepare sprint-002 exit acceptance and sprint-003 handoff

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-002-doctor-check-and-workspace-bootstrap-cutover`

## 1. 任务目标

Prepare the sprint-002 acceptance package and adopt/host service-native handoff.

## 2. Depends On

1. land workbench-native doctor-check and workspace bootstrap surfaces

## 3. 预期产物

1. governance handoff artifact for TK-970
2. task card update for TK-970
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-003-onboarding-adoption-readiness/tasks/DA-852-cli-exec-onboarding-and-adoption-readiness-promotion-cutover.md
2. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/project-113-vscode-primary-workbench-full-cutover-completion-audit-summary.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
2. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks" --task-id TK-970`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run check`
3. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks" --task-id TK-970`
4. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks" --task-id TK-970`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：整理 sprint-002 验收与 sprint-003 handoff，确认 adopt/host/verify/upgrade 将复用 `latestWorkspaceOperation` snapshot pattern，而不是退回 CLI-first bridge UX。
3. 2026-04-18：在验收包中补充 persisted snapshot 与 locale guard 要求，锁定后续 sprint 不能把另一种 UI 语言下的旧文案直接回放为当前 workbench 真值。

## 10. 产出

1. `sprint-002-exit-acceptance-and-sprint-003-handoff.md`
2. `doctor-check-workspace-bootstrap-cutover-contract-and-implementation.md`
