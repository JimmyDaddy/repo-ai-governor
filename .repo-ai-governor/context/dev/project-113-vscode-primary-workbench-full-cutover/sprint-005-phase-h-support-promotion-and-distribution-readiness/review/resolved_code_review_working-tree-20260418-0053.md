# Code Review: sprint-005 phase-h post-fix recheck round 3

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-003`
- Review Type: sprint boundary recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `docs/support-matrix.md`
2. `docs/support-matrix.zh-CN.md`
3. `scripts/release/verify-vscode-extension-distribution.js`
4. `test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
5. `apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`
6. `.repo-ai-governor/context/current-context.md`
7. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md`
8. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md`
9. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-002.md`
10. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-003.md`
11. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/checklist.md`
12. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/tasks.csv`
13. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/review/resolved_code_review_working-tree-20260418-0035.md`

## 2. Findings
### 2.1 [P2] Support-matrix evidence time still points at the pre-fix window
- 位置: `docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
- 问题描述: VS Code `primary_workbench_claim` 这一行已经引用 post-fix 的 distribution report 路径，但 evidence time 仍停留在 sidecar-readiness fail-fast 修复前的时间窗口。
- 影响: 当前公开 support-truth 会把强化后的 gate 证据指回 pre-fix 时间窗，削弱 `CS-004` 要求的交付证据可追溯性。
- 建议: 把中英文 support-matrix 的 evidence time 更新到这次 post-fix rerun 窗口，或改用不可变 artifact backlink。

### 2.2 [P3] Extracted-VSIX and symlink guards still lack focused regression coverage
- 位置: `scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
- 问题描述: 当前新增测试只覆盖了 sidecar lifecycle readiness；extracted-VSIX extraction 与 disallowed symlink payload 这两条 release-blocking branch 还缺一条 focused regression。
- 影响: 后续重构如果意外绕过 extracted-VSIX 或 symlink guard，现有测试仍可能保持绿色，install-safety invariants 会失去明确回归保护。
- 建议: 增加一条最小黑盒或 helper-level 测试，证明 extracted-VSIX path 会执行，且不允许的 symlink payload 会触发 gate 失败。

## 3. Notes
1. 本轮没有新的 review lifecycle drift 或 sprint ledger sync 问题。
2. GUI launch / install-extension 依然是文档声明的 manual-only evidence，不属于这轮自动 gate 的直接覆盖面。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）
9. `pnpm run check:ide-docs-parity`（通过）

## 5. 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：support-matrix 的 VS Code primary-workbench row 之前仍指向 pre-fix evidence time，而当前 report path 已在 CR-002 修复后重新生成；这确实会让公开 claim 的证据时间落后于实际 gate 窗口。
   - 处理：中英文 support-matrix 的 evidence time 已更新到最新 distribution verify rerun 的 UTC 时间窗。
2. `2.2`
   - 判定：**认可**
   - 证据：sidecar-readiness 测试之前只覆盖 `assertReadySidecarSmoke()`，确实还缺少一条专门覆盖 extracted-VSIX extraction 与 disallowed symlink payload 的 focused regression。
   - 处理：新增黑盒回归测试，显式证明 `extractVsix()` 会执行，且 extracted root 中不允许的 symlink payload 会触发 `verifySymlinkPayload()` 失败。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`（通过）
2. `pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
5. `pnpm run check:ide-docs-parity`（通过）

## 6. 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`pnpm run check:ide-docs-parity`（通过）
   - 说明：support-matrix 的 VS Code primary-workbench row 现已对齐到 post-fix distribution rerun 的 evidence time。
2. `2.2`：已完成
   - 变更文件：`scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
   - 验证：`pnpm exec vitest run test/release-vscode-extension-distribution-working-root.integration.test.ts test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`pnpm run build`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
   - 说明：release gate 现在既覆盖 sidecar lifecycle readiness，也覆盖 extracted-VSIX extraction 与 disallowed symlink payload 的 focused regression。
