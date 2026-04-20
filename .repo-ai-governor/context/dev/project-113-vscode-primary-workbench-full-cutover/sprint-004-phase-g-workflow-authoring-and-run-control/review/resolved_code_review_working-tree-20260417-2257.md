# Code Review: sprint-004 phase-g workflow authoring and run control round 2

- Status: resolved
- Date: 2026-04-17
- Reviewer: delegated reviewer (`gpt-5.4`, `xhigh`) + main agent verification
- Task: `CR-002`
- Review Type: sprint boundary recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
4. `apps/vscode-extension/src/types/index.ts`
5. `apps/vscode-extension/src/types/interfaces/index.ts`
6. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
7. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
8. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
9. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
10. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/plan.md`
11. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/plan.md`
12. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks/**`

## 2. Findings

1. `[P2]` `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
   - review-only workflow-studio actions previously relied on `executionId/executionSessionId: undefined` as the stale-selection clear signal.
   - `createCommandUri()` serializes requests through `JSON.stringify`, which drops `undefined` fields and means the real webview click path no longer carries those clear markers.
   - Existing controller tests passed literal `undefined` fields directly, so they did not prove the actual command-URI round-trip. This left review-only detail/handoff clicks vulnerable to retaining stale execution or queue state.

## 3. Notes

1. `CR-001` 已在同窗口完成 accepted finding 修复并进入 `resolved`；当前 `CR-002` 是 sprint-004 closeout 前的 fresh post-fix recheck round。
2. fresh reviewer 本轮只返回 1 条新的 P2：review-only command URI 的 transport-safe clear contract 仍未被真正证明；主 agent 已复核并认可。
3. accepted finding 修复后已再次通过 `pnpm run build`、ledger/code-review/sprint sync gates 与整仓 `pnpm run check`，当前 round 无剩余 accepted finding，sprint-004 已解除 review blocker。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）
8. `pnpm run check`（通过）

## 5. 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `[P2] Review-only command URIs lose explicit clear markers`
   - 判定：**认可**
   - 证据：review-only actions 使用 `JSON.stringify` 传输 command request 时会丢掉 `undefined` 字段，而我们此前的 controller tests 直接调用命令处理器并保留了这些 `undefined` keys，因此未真正覆盖 webview click path。
   - 处理：新增 transport-safe `clearExecutionSelection` 标记，由 builder 在 review-only URI 中显式携带；selection store 与 command merge path 统一消费该标记，并补充真实 URI round-trip regression tests 证明 stale execution/queue state 会被清空。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）

## 6. 修复执行记录（2026-04-17）

1. `[P2] Review-only command URIs lose explicit clear markers`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`、`apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）；`pnpm run build`（通过）；`node ./scripts/governance/check-task-required-inputs.js --tasks-dir .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-004-phase-g-workflow-authoring-and-run-control/tasks`（通过）；`node ./scripts/governance/check-task-ledger-sync.js`（通过）；`node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）；`node ./scripts/governance/check-code-review-status-sync.js`（通过）；`node ./scripts/governance/check-worktree-review-target.js`（通过）；`pnpm run check`（通过）
   - 说明：review-only workflow-studio command URI 现在显式携带 transport-safe `clearExecutionSelection` 标记，selection merge path 会在真实 webview command round-trip 中清空 stale execution、queue 与 temporary bridge 状态。
