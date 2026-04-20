# Code Review: sprint-004 docs, distribution evidence, and support-truth boundary

- Status: resolved
- Date: 2026-04-21
- Reviewer: Hume (delegated sub-agent)
- Task: `CR-001`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 1. Review Scope
1. `README.md`
2. `README.zh-CN.md`
3. `apps/vscode-extension/README.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`
8. `docs/support-matrix.md`
9. `docs/support-matrix.zh-CN.md`
10. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/plan.md`
11. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks/TK-1013-refresh-vscode-direct-onboarding-docs-and-copy-against-runtime-evidence.md`
12. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks/TK-1014-capture-built-source-and-local-vsix-direct-onboarding-evidence.md`
13. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks/TK-1015-prepare-support-truth-boundary-recommendation-and-sprint-handoff.md`
14. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks/tasks.csv`
15. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-built-source-and-local-vsix-direct-onboarding-summary.md`
16. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-support-truth-boundary-handoff.md`

## 2. Findings
### 2.1 [P2] Canonical ledger rows use the wrong recorded_at date
- 位置: `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks/tasks.csv:9`
- 问题描述: `TK-1013` 到 `TK-1015` 的 completed ledger rows 是在 `2026-04-21` 的本地 write-back 窗口追加的，但 canonical `recorded_at` 仍停留在 `2026-04-20`，与 checklist、sprint plan、以及 execution id 对应的真实写回时间不一致。
- 影响: closeout 与 completion-audit 若依赖 canonical `tasks.csv` 的时间序，会把 sprint-004 的完成真值排到实际证据写回之前，违反 `CS-021` 和 task-ledger contract 的同步要求。
- 建议: 校正 `TK-1013 ~ TK-1015` canonical task-card 的 `Date` 为真实的 `2026-04-21` write-back 日期，并重放 ledger sync 让最新 completed rows 使用正确的 `recorded_at`。

## 3. Notes
1. reviewer 额外提到 `docs/support-matrix*.md` 的 section heading 仍保留旧 task-id 后缀，但 row-level evidence 已更新，本轮未将其判定为 actionable finding。
2. 本轮变更只触及 docs / ledger / review artifact；当前修复窗口不需要新增 executable-code build 证据，但 sprint-004 原始 evidence window 已包含真实 `pnpm run build`。

## 4. Verification
1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过，review baseline）
2. `pnpm run build`（通过，review baseline）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，review baseline）
4. `pnpm run release:pack-vscode-extension -- --report .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-vscode-extension-pack-report-20260420T185446Z.json`（通过，review baseline）
5. `pnpm run release:verify-vscode-extension-distribution -- --output .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/project-116-sprint-004-vscode-distribution-report-20260420T185446Z.json`（通过，review baseline）
6. `pnpm pack --json --dry-run`（通过，review baseline）
7. `pnpm run check:ide-entry-smoke`（通过，review baseline）
8. `pnpm run check:ide-docs-parity`（通过，review baseline）

## 5. 复核结论（2026-04-21）
- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`TK-1013`、`TK-1014`、`TK-1015` 的 canonical task-card `Date` 已与 execution notes 对齐到 `2026-04-21`，因此后续 `sync-task-ledger.js` 生成的最新 completed rows 会把 `recorded_at` 回写到真实的 same-window closeout 日期。
   - 处理：accepted，已进入修复窗口。

### 验证命令
1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1013`（待修复后重跑）
2. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1014`（待修复后重跑）
3. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1015`（待修复后重跑）
4. `node ./scripts/governance/check-task-ledger-sync.js`（待修复后重跑）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（待修复后重跑）
6. `node ./scripts/governance/check-code-review-status-sync.js`（待修复后重跑）

## 6. 修复执行记录（2026-04-21）
1. `2.1`
   - 变更文件：`.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks/TK-1013-refresh-vscode-direct-onboarding-docs-and-copy-against-runtime-evidence.md`、`.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks/TK-1014-capture-built-source-and-local-vsix-direct-onboarding-evidence.md`、`.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks/TK-1015-prepare-support-truth-boundary-recommendation-and-sprint-handoff.md`、`.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks/tasks.csv`
   - 验证：`node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1013`、`node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1014`、`node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-004-docs-distribution-and-workbench-evidence/tasks" --task-id TK-1015`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`
   - 说明：canonical task-card `Date` 现在与 `2026-04-21` 的 same-window write-back 真值一致，latest completed ledger rows 会改用正确的 `recorded_at`，从而恢复 sprint-004 closeout/audit 的时间序可靠性。

## 7. 处置结果与剩余风险
1. 本轮唯一 accepted finding 已在同一治理窗口内完成 ledger 真值修复，并通过 ledger/review sync 校验复核。
2. `docs/support-matrix*.md` 的 section heading 残留旧 task-id 后缀仍作为非阻断 note 保留；当前 row-level evidence 与 residual-risk wording 已经对齐，不阻止 sprint-004 closeout。
3. 未发现阻止 `sprint-004-docs-distribution-and-workbench-evidence` 进入 closeout 的 residual actionable finding。
