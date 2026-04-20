# Code Review: sprint-005 phase-h promotion evidence and readiness deltas

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint boundary review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `scripts/release/pack-vscode-extension.js`
2. `scripts/release/verify-vscode-extension-distribution.js`
3. `apps/vscode-extension/src/constants/vscode-extension.constant.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
5. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
6. `apps/vscode-extension/README.md`
7. `docs/support-matrix.md`
8. `docs/support-matrix.zh-CN.md`
9. `docs/local-adoption-playbook.md`
10. `docs/local-adoption-playbook.zh-CN.md`
11. `docs/maintainer-validation-playbook.md`
12. `docs/maintainer-validation-playbook.zh-CN.md`
13. `.repo-ai-governor/context/current-context.md`
14. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md`
15. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md`
16. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/TK-958-freeze-phase-h-promotion-and-distribution-readiness-boundary.md`
17. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/TK-959-execute-gui-and-distribution-readiness-evidence-bundle.md`
18. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/TK-960-refresh-support-truth-docs-and-claim-promotion-package.md`
19. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/TK-961-prepare-project-final-closeout-and-next-stream-recommendation.md`
20. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/checklist.md`
21. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/tasks.csv`

## 2. Findings
### 2.1 [P2] TK-958 recorded a package-only vitest command as if it covered the root integration guard
- 位置: `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/TK-958-freeze-phase-h-promotion-and-distribution-readiness-boundary.md`
- 问题描述: 任务卡与 `tasks.csv` 把 `test/release-vscode-extension-distribution-working-root.integration.test.ts` 记在 `vitest.packages.config.ts` 这条命令里，但该 config 只覆盖 `apps/**/test` 与 `packages/**/test`，所以 root integration guard 实际没有进入记录的证据窗。
- 影响: `--working-root` cleanup safety branch 会落在已声明通过的验证链之外，Phase H 的分发安全证据会失真。
- 建议: 把 package-scoped vitest 与 root integration test 拆成两条真实执行命令，并回写 TK-958 与 ledger 的验证记录。

### 2.2 [P2] CR-001 lifecycle drifted from `review_pending` back to `planned`
- 位置: `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-001-verify-phase-h-promotion-evidence-and-readiness-deltas.md`
- 问题描述: `CR-001` 的 seed row 是 `review_pending`，但 task card、sprint plan、checklist 与后续 CSV 行又回退成了 `planned`。
- 影响: 这会破坏仓库要求的 `review_pending -> verified -> resolved` 评审生命周期，并干扰 sprint closeout / review automation。
- 建议: 在进入本轮 review 时，把 `CR-001` 在 task card、plan、checklist、tasks.csv 全部统一为 `review_pending`。

### 2.3 [P3] Workflow Studio still suggests Desktop may be re-evaluated
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
- 问题描述: 当 `primary_workbench_claim` 已激活且 temporary bridge 为空时，UI 仍提示 Desktop 可被重新评估为并存 secondary surface，但同一窗口的 support docs 明确把 Desktop 固定在 `foundation_only_secondary_surface`。
- 影响: 产品内 guidance 与公开 support truth 不一致，人工验证时容易被错误引导。
- 建议: 让 `getDesktopDecisionGuidance()` 与当前 support-truth 一致，并补上对应的 presentation-builder 断言。

## 3. Notes
1. 当前没有发现 packaging script 的运行时失败；风险集中在验证证据真实性、review lifecycle 真值，以及一处用户可见 guidance copy 漂移。
2. `primary_workbench_claim` 的 support docs 收口总体方向正确，但必须把上述 lifecycle/evidence drift 一并修完，后续 refresh 才不会再次混淆。

## 4. Verification
1. `pnpm exec vitest list --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts test/release-vscode-extension-distribution-working-root.integration.test.ts`（通过）
2. `pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts`（通过）
3. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
4. `pnpm run build`（通过）
5. `pnpm run check`（通过）

## 5. 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`TK-958` 已把 package-scoped vitest 与根级 `test/release-vscode-extension-distribution-working-root.integration.test.ts` 拆成两条真实验证命令，避免 `vitest.packages.config.ts` 虚覆盖根级 integration guard。
   - 处理：按真实命令拆分验证记录，并在后续 ledger sync 中同步 checklist / `tasks.csv` 的终态证据。
2. `2.2`
   - 判定：**认可**
   - 证据：`CR-001` 任务卡、sprint/project 计划面与本 review 生命周期文件已经重新对齐到受管的 CR 状态流。
   - 处理：在同一窗口把 `CR-001` 推进到 `resolved`，并同步派生台账，避免再次回退到 `planned`。
3. `2.3`
   - 判定：**认可**
   - 证据：`getDesktopDecisionGuidance()` 已固定为“Desktop 继续保持 foundation-only secondary surface”，对应断言已补到 `vscode-extension-presentation-builder.test.ts`。
   - 处理：保持 runtime guidance 与 support docs 一致，不再暗示 Desktop 会被重新评估为并列 primary。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
5. `pnpm run check:ide-entry-smoke`（通过）
6. `pnpm run check:ide-docs-parity`（通过）
7. `pnpm pack --json --dry-run`（通过）
8. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks"`（通过）
9. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
10. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
11. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
12. `node ./scripts/governance/check-worktree-review-target.js`（通过）
13. `pnpm run check`（通过）

## 6. 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/TK-958-freeze-phase-h-promotion-and-distribution-readiness-boundary.md`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`、`pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts`（通过）
   - 说明：Phase H 的 distribution safety evidence 已改为 package tests 与 root integration test 分离记录，避免验证口径失真。
2. `2.2`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-001-verify-phase-h-promotion-evidence-and-readiness-deltas.md`、`.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md`、`.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md`
   - 验证：`node ./scripts/governance/sync-task-ledger.js --tasks-dir ".repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks" --task-id CR-001 --status resolved`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`pnpm run check`（通过）
   - 说明：主源状态、review lifecycle 与派生台账已经在同一窗口回收到一致真值。
3. `2.3`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
   - 说明：Workflow Studio guidance 已固定为 VS Code primary-workbench claim + Desktop foundation-only secondary surface 的最终公开口径。
