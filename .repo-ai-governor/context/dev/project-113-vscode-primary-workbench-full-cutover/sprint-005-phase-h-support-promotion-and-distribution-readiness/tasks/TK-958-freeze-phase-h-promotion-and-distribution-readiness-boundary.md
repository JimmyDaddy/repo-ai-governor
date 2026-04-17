# TK-958 freeze phase-h promotion and distribution-readiness boundary

- Status: completed
- Date: 2026-04-17
- Owner: AI-Agent
- Priority: P1
- Project: `project-113-vscode-primary-workbench-full-cutover`
- Sprint: `sprint-005-phase-h-support-promotion-and-distribution-readiness`

## 1. 任务目标

冻结 support-truth promotion、distribution readiness、desktop relationship 与 public-claim gate boundary。

## 2. Depends On

1. prepare sprint-004 exit acceptance and phase-h handoff

## 3. 预期产物

1. promotion boundary artifact for TK-958
2. task card update for TK-958
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. docs/support-matrix.zh-CN.md
2. apps/vscode-extension/README.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md

## 5. Traceback References

1. .repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/project-112-vscode-governance-workbench-rollout-completion-audit-summary.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md
4. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts
2. pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts
3. pnpm run build
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-958

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-958
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id TK-958
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. node ./scripts/governance/check-code-review-status-sync.js

## 9. 执行记录

1. 2026-04-17：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 sprint-004 在 `CR-002` resolved round 后完成 closeout，当前任务已切换为 `in_progress`，开始从 `.tmp/project-113-boundary-parking/phase-h.patch` 与 Phase H docs truth-sync handoff 固定 promotion/distribution-readiness boundary，并继续保持 `scripts/governance/check-sprint-plan-status-sync.js` 不纳入本项目交付。
3. 2026-04-17：Phase H boundary 已冻结为“VS Code built-source checkout + local VSIX / packaged extension root 维持 `primary_workbench_claim`，Desktop 继续保持 `foundation_only_secondary_surface`，且 packaged runtime 必须保留 pnpm metadata、sidecar readiness 与 symlink-safe payload 边界”；当前代码与 targeted vitest、`pnpm run build` 已在同窗口通过，任务切换为 `completed`。
4. 2026-04-18：根据 fresh reviewer round 的 P2 复核，当前任务把 package-scoped vitest 与根级 `test/release-vscode-extension-distribution-working-root.integration.test.ts` 分拆记录，避免 `vitest.packages.config.ts` 遗漏 root integration guard 的证据漂移。

## 10. 产出

1. `scripts/release/pack-vscode-extension.js` 与 `scripts/release/verify-vscode-extension-distribution.js` 已固定 packaged-root / extracted-VSIX 双视角的 runtime-closure contract，并显式限制 symlink payload。
2. `apps/vscode-extension/src/constants/vscode-extension.constant.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts` 与对应测试已把公开 support-truth 提升到 `primary_workbench_claim`，且保持 Desktop 的 foundation-only secondary-surface 定位。
