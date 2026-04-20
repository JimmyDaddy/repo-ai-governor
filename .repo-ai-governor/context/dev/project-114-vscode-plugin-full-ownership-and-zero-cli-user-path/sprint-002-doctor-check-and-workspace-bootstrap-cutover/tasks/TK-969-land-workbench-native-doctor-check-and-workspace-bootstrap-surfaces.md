# TK-969 land workbench-native doctor-check and workspace bootstrap surfaces

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-002-doctor-check-and-workspace-bootstrap-cutover`

## 1. 任务目标

Plan the workbench-native doctor, check, and bootstrap surfaces that remove the visible CLI bootstrap dependency.

## 2. Depends On

1. implement service-native doctor-check and workspace bootstrap seams

## 3. 预期产物

1. workbench surface artifact for TK-969
2. task card update for TK-969
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. apps/vscode-extension/README.md
2. .repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-786-local-user-config-promotion-and-rollout-decomposition-handoff.md
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

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
2. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks" --task-id TK-969`

## 8. Delivery Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
2. `pnpm run build`
3. `pnpm run check`
4. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks" --task-id TK-969`
5. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-002-doctor-check-and-workspace-bootstrap-cutover/tasks" --task-id TK-969`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：workbench overview、workflow studio 与 `/status` 已接入最近一次 workspace operation，持续显示诊断摘要、attention checks、receipt/backlink、follow-up prompts 与 layered progress。
3. 2026-04-18：对 latest workspace operation 增加 locale mismatch guard；当快照来自另一种语言时，workbench 继续显示 locale-neutral facts，并提示用户在当前 workbench 语言下重跑以刷新摘要、建议动作和进度文案。

## 10. 产出

1. `doctor-check-workspace-bootstrap-cutover-contract-and-implementation.md`
2. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
3. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
4. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
