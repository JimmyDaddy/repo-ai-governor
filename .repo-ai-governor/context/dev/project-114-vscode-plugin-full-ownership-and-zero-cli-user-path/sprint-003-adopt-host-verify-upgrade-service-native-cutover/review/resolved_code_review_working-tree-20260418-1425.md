# Code Review: sprint-003 adopt-host-verify-upgrade service-native cutover

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint boundary review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
7. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
8. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-selection-store.test.ts`

## 2. Findings
### 2.1 [P1] Explicit compatibility-bridge requests can be overridden by stale direct-operation state
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:763`, `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:1285`
- 问题描述: merged request 会把 selection 中缓存的 `workspaceOperationKind/workspaceOperationArguments` 带入只显式提供 `temporaryBridge` 的请求，而且 resolver 会优先执行 merged direct operation。
- 影响: 用户在执行过一次 direct repository operation 后，再次触发显式 compatibility bridge 时可能执行错误的 host/upgrade 操作，甚至复用陈旧的 upgrade apply 参数。
- 建议: 当请求显式携带 `temporaryBridge` 时，不继承陈旧 direct-operation state，并让显式 bridge routing 在 resolution 中优先于缓存态。

### 2.2 [P2] Review detail refresh drops direct workspace-operation selection
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts:70`
- 问题描述: review-detail refresh 重新写回 selection state 时只保留 `temporaryBridge`，没有把新引入的 `workspaceOperationKind/workspaceOperationArguments` 一起带回。
- 影响: workbench/workflow studio 中选中的 direct repository operation 会在下一次 review-detail refresh 后丢失，导致无参重跑和后续命令行为不稳定。
- 建议: refresh rehydrate 时同步保留 direct workspace-operation selection fields。

## 3. Notes
1. reviewer 还指出 direct `workspaceOperationKind` 主路径缺少端到端回归测试，当前新增测试还没有覆盖 stale selection precedence 和 review-detail persistence。
2. 本轮 review 聚焦 sprint-003 owned boundary，未向外扩展到其他 sprint。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts`（通过，review 前基线）
2. `pnpm run build`（通过，review 前基线）
3. `pnpm run check`（通过，review 前基线）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`mergeCommandRequest()` 会继承 selection 中的 direct-operation state，而 `resolveWorkspaceOperationRequest()` 会在显式 bridge 之前优先消费 merged direct-operation state。
   - 处理：已接受，修复为“显式 request 优先于缓存态”，并补充回归测试覆盖 stale selection precedence。

2. `2.2`
   - 判定：**认可**
   - 证据：`VsCodeExtensionReviewDetailProvider.render()` 在 rehydrate selected execution 时只保留 `temporaryBridge`，没有保留新增的 direct workspace-operation fields。
   - 处理：已接受，修复为 review-detail refresh 同步保留 direct workspace-operation selection，并补充对应回归测试。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：显式 `temporaryBridge` 请求不再继承陈旧 direct-operation state，并在 resolver 中先于缓存态被解析。

2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：review-detail refresh 现在会保留 direct workspace-operation selection，并有回归测试锁住 refresh persistence。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复并重跑 targeted tests、`pnpm run build`、`pnpm run check`。
2. sprint-003 direct repository-operation path 现在同时覆盖显式 bridge 优先级与 review-detail refresh persistence 两个回归分支。
