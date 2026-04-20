# CR-001 verify phase-h promotion evidence and readiness deltas

- Status: resolved
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-005-phase-h-support-promotion-and-distribution-readiness`

## 1. 任务目标

验证 Phase H support-promotion/distribution-readiness 的 evidence/docs delta，并收敛 accepted findings。

## 2. Depends On

1. prepare project-final closeout and next-stream recommendation

## 3. 预期产物

1. review artifact for CR-001
2. task card update for CR-001
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. docs/support-matrix.zh-CN.md
2. docs/maintainer-validation-playbook.zh-CN.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md

## 5. Traceback References

1. apps/vscode-extension/README.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
3. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts
2. pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts
3. pnpm run build
4. pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json
5. pnpm pack --json --dry-run
6. pnpm run check:ide-entry-smoke
7. pnpm run check:ide-docs-parity
8. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks"
9. node ./scripts/governance/check-task-ledger-sync.js
10. node ./scripts/governance/check-sprint-plan-status-sync.js
11. node ./scripts/governance/check-code-review-status-sync.js
12. node ./scripts/governance/check-worktree-review-target.js
13. pnpm run check

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id CR-001
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id CR-001
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. node ./scripts/governance/check-code-review-status-sync.js
6. node ./scripts/governance/check-worktree-review-target.js
7. pnpm run check

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-18：已复用 sprint-005 预留的 `CR-001` 启动 initial fresh reviewer round；当前任务切换为 `review_pending`，pending report 路径固定为 `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/review/code_review_working-tree-20260418-0007.md`。
3. 2026-04-18：fresh reviewer round 的 3 条 finding 已全部认可并完成修复/复验；当前任务切换为 `resolved`，review lifecycle 报告路径更新为 `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/review/resolved_code_review_working-tree-20260418-0007.md`。

## 10. 产出

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/review/resolved_code_review_working-tree-20260418-0007.md
2. 已在 resolved report 中记录 3 条 accepted finding 的复核结论与修复执行记录
