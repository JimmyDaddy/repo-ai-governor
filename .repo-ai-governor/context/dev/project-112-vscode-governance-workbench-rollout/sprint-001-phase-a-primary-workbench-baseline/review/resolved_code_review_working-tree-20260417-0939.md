# Code Review: sprint-001 primary workbench baseline round 2

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: sprint boundary review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/package.json`
2. `apps/vscode-extension/package.nls.json`
3. `apps/vscode-extension/package.nls.zh-cn.json`
4. `apps/vscode-extension/src/**`
5. `apps/vscode-extension/test/**`
6. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/tasks/TK-936-freeze-vscode-primary-workbench-baseline-and-service-owned-task-review-seams.md`
7. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/review/resolved_code_review_working-tree-20260417-0815.md`

## 2. Findings

### 2.1 [P2] Review-only queue items can reopen unrelated execution detail

- 位置: `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:255`
- 问题描述: review queue item 在仅携带 `reviewSourcePath` 且显式清空 `executionId` 时，`resolveReviewDetailSnapshot()` 仍会回退到最新 execution；随后 review-detail provider 会把这个 fallback execution 回写进 transient selection，导致 detail webview 看起来像是跟着最新 execution，而不是跟着用户点击的 canonical review backlink。
- 影响: 用户从 review queue 打开一个 review-only item 时，可能会看到并重新锚定到无关 execution detail，违背 workbench surface 只消费 service-owned queue/backlink truth 的 Phase A 边界。
- 建议: 当 transient selection 已显式声明 `executionId: undefined` 时，禁止回退到最新 execution；同时给 execution/HITL re-anchor 路径补显式 `reviewSourcePath` 清理语义，并增加 review-only `OPEN_REVIEW_DETAIL` 回归测试。

## 3. Notes

1. 本轮修复顺手把 execution/HITL re-anchor 的 stale `reviewSourcePath` 清理链补齐，避免从 review-only queue item 切回 execution 面时 workbench overview 和 detail provider 继续持有旧 review backlink。
2. `context/` 下未跟踪的 runtime sqlite 噪音仍未纳入本轮 actionable finding；当前评审边界继续限定在 sprint-001 的 VS Code extension surface 与其治理台账面。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Review-only queue items can reopen unrelated execution detail`
   - 判定：**认可**
   - 证据：`createReviewQueueRequest()` 已经允许 review-only item 显式清空 `executionId`，但 `resolveReviewDetailSnapshot()` 在 `executionId` 为空时仍调用 `resolveExecutionBoardEntry()` 的默认 fallback；同时 review-detail provider 会把 fallback execution 回写进 selection store，确实会把 review-only detail 锚到无关 execution。
   - 处理：已接受，主 agent 已修复 service runtime 对显式 cleared execution selection 的 fallback，并补 execution/HITL re-anchor 的 review-source 清理语义与对应回归测试。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-17）

1. `2.1 [P2] Review-only queue items can reopen unrelated execution detail`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：当前已把 review-only selection 的 `executionId: undefined` 解释为“显式不回退 execution”，同时让 execution/HITL re-anchor 路径显式清空 stale `reviewSourcePath`，并补齐 review-only `OPEN_REVIEW_DETAIL` 与 workbench overview 不回退 execution 的回归测试。
