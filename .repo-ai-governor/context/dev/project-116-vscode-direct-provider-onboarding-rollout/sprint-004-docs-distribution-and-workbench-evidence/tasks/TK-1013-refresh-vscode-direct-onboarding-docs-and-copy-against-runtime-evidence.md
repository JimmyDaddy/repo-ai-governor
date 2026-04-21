# TK-1013 refresh vscode direct-onboarding docs and copy against runtime evidence

- Status: completed
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-004-docs-distribution-and-workbench-evidence`

## 1. 任务目标

Update plugin-facing docs and copy only after runtime evidence exists.

## 2. Depends On

1. verify provider lifecycle readiness parity and sprint handoff

## 3. 预期产物

1. docs package artifact for TK-1013
2. task card update for TK-1013
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run release:pack-vscode-extension -- --report .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-vscode-extension-pack-report-20260420T185446Z.json`
5. `pnpm run release:verify-vscode-extension-distribution -- --output .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-vscode-distribution-report-20260420T185446Z.json`
6. `pnpm pack --json --dry-run`
7. `pnpm run check:ide-entry-smoke`
8. `pnpm run check:ide-docs-parity`
9. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1013`

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1013
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1013
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-21：`sprint-003-readiness-cta-and-provider-lifecycle` 已完成 closeout，当前任务切换为 `in_progress`，作为 `project-116 / sprint-004-docs-distribution-and-workbench-evidence` 的首个 active execution boundary。
3. 2026-04-21：先完成 built-source / local-VSIX 证据窗口，再按同窗口 snapshot 回写 README、VS Code README、adoption/maintainer playbook 与 support matrix 的保守 direct-onboarding wording，不提前宣称 sprint-005 才能证明的 zero-env-var clean-room 结论。

## 10. 产出

1. 更新了 `README*`、`apps/vscode-extension/README.md`、`docs/local-adoption-playbook*`、`docs/maintainer-validation-playbook*` 与 `docs/support-matrix*` 的 direct-provider-onboarding wording。
2. 生成了 `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-built-source-and-local-vsix-direct-onboarding-summary.md`。
