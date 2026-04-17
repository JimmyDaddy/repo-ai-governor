# Code Review: sprint-005 phase-h post-fix recheck round 4

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-004`
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
3. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/project-113-sprint-005-vscode-distribution-report-20260417T171401Z.json`
4. `.repo-ai-governor/context/current-context.md`
5. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md`
6. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/plan.md`
7. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-003.md`
8. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-004.md`
9. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/checklist.md`
10. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/tasks.csv`

## 2. Findings
### 2.1 [P2] Support-truth still pointed at mutable VS Code evidence
- 位置: `docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
- 问题描述: support-matrix 的 VS Code primary-workbench row 继续回链可被后续 rerun 覆盖的 `.tmp/project-113-sprint-005-vscode-distribution-report.json`，即便更新时间戳，也会在下一次正常验证后再次漂移。
- 影响: 公开 `primary_workbench_claim` 的证据真值会再次脱离固定时间窗，违反 `CS-004` 对交付证据可追溯性的要求。
- 建议: 让 support-truth 回链到一份带时间戳的不可变 distribution evidence snapshot，而不是继续直接引用可变 `.tmp` 报告。

## 3. Notes
1. 本轮未再出现新的 sprint-ledger 或 CR-lifecycle 漂移。
2. GUI launch / install-extension 仍保持为文档声明的 optional manual evidence，不属于本轮自动 gate 直接覆盖面。

## 4. Verification
1. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
2. `pnpm run check:ide-docs-parity`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 5. 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：support-matrix 的证据时间之前仍会被下一次 `.tmp` rerun 立刻打破，因为 public row 仍直接回链到可变 artifact。
   - 处理：复制出一份带时间戳的 immutable distribution evidence snapshot，并让中英文 support-matrix 全部回链这份固定证据。

### 验证命令
1. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`（通过）
2. `pnpm run check:ide-docs-parity`（通过）

## 6. 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`、`.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/project-113-sprint-005-vscode-distribution-report-20260417T171401Z.json`
   - 验证：`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-113-sprint-005-vscode-distribution-report.json`、`pnpm run check:ide-docs-parity`（通过）
   - 说明：support-truth 现在回链到 immutable evidence snapshot；后续正常 rerun 只会更新 `.tmp` 工作报告，不会再把 public claim 的证据时间打回漂移状态。
