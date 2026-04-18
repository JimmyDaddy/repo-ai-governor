# TK-978 prepare sprint-004 exit acceptance and sprint-005 handoff

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-004-workflow-authoring-run-review-and-automation-primaryization`

## 1. 任务目标

Prepare the sprint-004 acceptance package and support-truth migration handoff.

## 2. Depends On

1. land workflow studio review and automation primary surfaces

## 3. 预期产物

1. governance handoff artifact for TK-978
2. task card update for TK-978
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/project-113-vscode-primary-workbench-full-cutover-completion-audit-summary.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks" --task-id TK-978

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks" --task-id TK-978
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks" --task-id TK-978
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：完成 sprint-004 acceptance package：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`pnpm run build`、`pnpm run check` 已通过。
3. 2026-04-18：sprint-005 handoff 固定为 support-truth / migration 窗口：需要同步 `apps/vscode-extension/README.md` 与 adopter-facing support docs，把 CLI 收口为 optional automation/scriptable path，并补齐 packaged/local VSIX 的 zero-cli rehearsal evidence。

## 10. 产出

1. sprint-004 acceptance evidence recorded in task execution log
2. sprint-005 support-truth handoff note recorded in task execution log
