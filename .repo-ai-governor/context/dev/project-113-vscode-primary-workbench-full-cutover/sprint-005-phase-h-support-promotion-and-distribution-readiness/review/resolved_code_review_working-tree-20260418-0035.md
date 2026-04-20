# Code Review: sprint-005 phase-h post-fix recheck round 2

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: sprint boundary recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `scripts/release/verify-vscode-extension-distribution.js`
2. `scripts/release/pack-vscode-extension.js`
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
16. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-001-verify-phase-h-promotion-evidence-and-readiness-deltas.md`
17. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-002.md`
18. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/checklist.md`
19. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/tasks.csv`
20. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/review/resolved_code_review_working-tree-20260418-0007.md`

## 2. Findings
### 2.1 [P2] Distribution verify still passes when sidecar lifecycle is not `ready`
- 位置: `scripts/release/verify-vscode-extension-distribution.js`
- 问题描述: `runPackagedSidecarSmoke()` 当前只记录 `health.lifecycleStatus`，但 `release:verify-vscode-extension-distribution` 在 packaged root 与 extracted VSIX 两条 smoke path 上都没有对非 `ready` 状态执行 fail-fast。
- 影响: 即使 sidecar 只达到 `starting` / `stopping` / `stopped`，distribution gate 仍可能产出 `status: "pass"` 报告，削弱 `primary_workbench_claim` 所依赖的 packaged sidecar-readiness 证据。
- 建议: 对 packaged root 与 extracted VSIX 两条 smoke path 统一要求 `serviceLifecycle === "ready"`，并补一个 focused regression test 覆盖非 `ready` 分支。

## 3. Notes
1. 本轮未再发现新的 review lifecycle drift 或 sprint ledger sync gap。
2. 真实 VS Code GUI launch / install-extension 仍是文档声明的 manual-only evidence，不属于本轮自动 gate 直接覆盖范围。

## 4. Verification
1. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-worktree-review-target.js`（通过）
5. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
6. `pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
7. `pnpm run build`（通过）
8. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/reviewer-cr002-vscode-distribution-report.json`（通过）
9. `pnpm run check:ide-entry-smoke`（通过）
10. `pnpm run check:ide-docs-parity`（通过）
11. `pnpm pack --json --dry-run`（通过）

## 5. 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`runPackagedSidecarSmoke()` 之前只回传 `serviceLifecycle`，但 distribution verify 的 pass path 没有对非 `ready` 状态执行 fail-fast；这会让 packaged root / extracted VSIX 的 sidecar readiness contract 失去阻断力。
   - 处理：对 packaged root 与 extracted VSIX 两条 smoke path 统一要求 `serviceLifecycle === "ready"`，并补了 focused negative regression test。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）

## 6. 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
   - 验证：`pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`pnpm run build`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
   - 说明：distribution gate 现在会在 packaged root 或 extracted VSIX sidecar smoke 不为 `ready` 时直接失败，且新增负向测试覆盖 `starting/stopping/stopped` 分支。
