# Code Review: sprint-002 phase-e operations cutover round 2

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: sprint boundary post-fix recheck
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
5. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
6. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
7. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md`
8. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/plan.md`
9. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks/**`

## 2. Findings

1. `[accepted][CS-022][P1]` degraded provider tests introduced native `new Error(...)` in `test/**`, which fails the repository standardized-error gate.
2. `[accepted][CS-017][P2]` `vscode-extension-service-runtime.ts` added pure function-style fallback DTO helpers inside a runtime module without the required nearby `// oop-function-allowed: reason` justification comment.

## 3. Disposition

1. 已接受 P1 finding。
2. 修复方式：把 `resolveReviewDetailSnapshot` / `resolveWorkflowStudioSnapshot` reject-path 测试改为抛出 `RuntimeError(GovernorErrorCode.PROCESS_RUNTIME_CANCELLED, ...)`，与 `CS-022` 的标准化错误模型保持一致。
3. 已接受 P2 finding。
4. 修复方式：在 `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts` 的 fallback DTO helper 组前补充 `// oop-function-allowed: ...` 注释，显式说明这些纯值工厂为何保留函数式形态。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过，`2` files / `29` tests）
3. `node ./scripts/governance/check-standardized-error-usage.js`（通过）
4. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-002-phase-e-operations-cutover/tasks`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 5. Residual Risk

1. round-2 accepted findings 已修复并验证，但按照 `workspace-scoped-cr-loop` 退出规则，sprint-002 仍需再跑一轮 fresh reviewer recheck；只有最新 round 无 actionable finding 时才能进入 sprint closeout。
