# Code Review: sprint-002-vscode-editor-companion-mvp

- Status: resolved
- Date: 2026-04-05
- Reviewer: AI-Agent
- Task: `TK-562 / TK-563 / TK-564`
- Review Type: owned scope review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/desktop-command-center-and-vscode-editor-companion-split.md`

## 1. Review Scope
1. `apps/vscode-extension/**`
2. `integrations/ide/README.md`
3. `package.json`
4. `pnpm-lock.yaml`
5. `tsconfig.json`
6. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/plan.md`
7. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/plan.md`
8. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/TK-562-freeze-vscode-editor-companion-mvp-extension-contract-and-surface-boundary.md`
9. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/TK-563-implement-governor-view-container-chat-participant-and-editor-local-governed-commands.md`
10. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/TK-564-wire-review-hitl-context-views-workspace-trust-gating-and-extension-acceptance.md`
11. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/checklist.md`
12. `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/tasks.csv`

## 2. Findings
### 2.1 [P1] Review Detail webview does not follow selection changes
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-host.ts:144`, `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:310`
- 问题描述: tree selection changes only update the transient selection store and refresh the workspace-context tree. Neither `handleExecutionBoardSelection()` nor `handleHitlInboxSelection()` refreshes the already-resolved `VsCodeExtensionReviewDetailProvider`, so an open `Review Detail` webview keeps rendering the previous execution until the user manually triggers `Open Review Detail` or a full refresh. That breaks the intended "detail-only webview over the current selection" contract and creates stale review/HITL evidence during drill-down.
- 影响: users can inspect or act on one execution in the lightweight views while still seeing another execution's review detail in the webview, which is especially risky around HITL and handoff decisions.
- 建议: when the selected tree node changes, refresh the review-detail provider from the same selection event whenever the webview has been resolved, so workspace context and detail drill-down stay in sync.

### 2.2 [P1] Sticky `reviewSourcePath` leaks stale review routing across selections
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts:28`, `apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts:68`, `apps/vscode-extension/src/runtime/vscode-extension-host.ts:45`
- 问题描述: `VsCodeExtensionSelectionStore.applyCommandRequest()` only writes truthy fields and never clears `reviewSourcePath`. `VsCodeExtensionReviewDetailProvider.render()` only remembers a review source when `artifactPane.reviewSourcePath` exists, and `workspaceContextProvider` later renders whatever stale value remains in the store. After opening detail for execution A, then moving to execution B that has no routed review document yet, the workspace context can still show A's review path as if it belonged to B.
- 影响: this turns the transient selection store into sticky shadow routing state and can surface the wrong review document path in the workspace context, misleading follow-up review/handoff work.
- 建议: allow the transient selection model to clear fields explicitly when the newly resolved detail has no review source, or stop storing `reviewSourcePath` separately and derive it from the latest service-backed detail snapshot.

### 2.3 [P2] Critical trust/selection/controller branches still have no automated coverage
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:47`, `apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts:41`, `apps/vscode-extension/test/vscode-extension-contract.test.ts:1`
- 问题描述: the current suite only covers manifest-contract parity and presentation rendering. There is no test coverage for trust-gated command rejection, selection-change propagation, review-detail refresh, or stale selection clearing. The two user-visible defects above both live in these uncovered branches, so sprint-002 acceptance is still relying on manual inspection for the highest-risk control-flow paths.
- 影响: future refactors can silently regress trust gating, handoff fallback, and review-detail continuity without any failing test to stop the sprint closeout.
- 建议: add focused tests for `VsCodeExtensionCommandController`, `VsCodeExtensionReviewDetailProvider`, and `VsCodeExtensionSelectionStore` covering trust refusal, selection-driven detail refresh, and clearing stale review-source state.

## 3. Notes
1. I did not find evidence that the extension owns a second execution/session/policy truth beyond the transient selection snapshot; the main contract boundary remains service-owned.
2. Manifest-side and runtime-side trust gating are both present for the declared trust-sensitive commands, but the uncovered controller/provider branches above leave important behavior paths unguarded by tests.
3. Main-agent build/smoke/docs-parity evidence was already recorded in the sprint ledger before this review. I did not rerun those heavier gates in this reviewer pass.

## 4. Verification
1. `git status --short`（通过）
2. `git diff -- apps/vscode-extension integrations/ide/README.md package.json pnpm-lock.yaml tsconfig.json .repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/plan.md .repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/plan.md .repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/TK-562-freeze-vscode-editor-companion-mvp-extension-contract-and-surface-boundary.md .repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/TK-563-implement-governor-view-container-chat-participant-and-editor-local-governed-commands.md .repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/TK-564-wire-review-hitl-context-views-workspace-trust-gating-and-extension-acceptance.md .repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/checklist.md .repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-002-vscode-editor-companion-mvp/tasks/tasks.csv`（通过）
3. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）

## 复核结论（2026-04-05）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`handleExecutionBoardSelection()` 与 `handleHitlInboxSelection()` 之前只刷新 workspace context，不刷新已解析的 `Review Detail` provider；已打开 webview 时确实会停留在旧 execution 详情。
   - 处理：已在 selection handler 中同步调用 `reviewDetailProvider.refresh(request)`，使 detail-only webview 跟随当前 tree selection 更新。
2. `2.2`
   - 判定：**认可**
   - 证据：`VsCodeExtensionSelectionStore.applyCommandRequest()` 之前只在 `reviewSourcePath` truthy 时写入，`VsCodeExtensionReviewDetailProvider.render()` 也只在存在 review path 时 remember，导致旧 review source 粘滞残留。
   - 处理：已让 selection store 支持显式清空 `reviewSourcePath`，并在 review-detail render 阶段始终回写最新的 service-backed review source（包括 `undefined`）。
3. `2.3`
   - 判定：**认可**
   - 证据：原测试仅覆盖 contract/presentation，并未覆盖 trust refusal、selection propagation 与 stale review-source clearing 分支。
   - 处理：已新增 focused tests，覆盖 selection-driven review detail refresh、workspace trust refusal，以及 stale review-source clearing。

### 验证命令
1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
2. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:ide-docs-parity`（通过）

## 修复执行记录（2026-04-05）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
   - 说明：selection handler 现在会同步刷新 review detail provider，避免 webview 停留旧 execution。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`、`apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
   - 说明：review source path 现在可以随最新 detail snapshot 显式清空，不再形成 selection drift。
3. `2.3`：已完成
   - 变更文件：`apps/vscode-extension/test/vscode-extension-selection-store.test.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
   - 说明：已补 trust gate、selection propagation、review detail refresh 与 stale review-source clearing 自动化覆盖。

## 子 agent 复审结果（2026-04-05）

1. reviewer 子 agent 第二轮复审结论：`No actionable findings.`
2. 结论：`sprint-002` owned scope 已达到零 actionable finding，可按 `resolved` 保持关闭状态。
