# Code Review: sprint-004 workflow-authoring run-review and automation primaryization

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
1. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/package.json`
2. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/package.nls.json`
3. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/package.nls.zh-cn.json`
4. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/constants/vscode-extension.constant.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-contract.ts`
7. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-host.ts`
8. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
9. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
10. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-contract.test.ts`
11. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
12. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-host.activation.test.ts`
13. `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`

## 2. Findings
### 2.1 [P2] Automation queue inline action drops the clicked selection
- 位置: `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/package.json:211`, `/Users/jimmydaddy/study/ai-governor/apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:85`
- 问题描述: `view/item/context` 上的 `repoAiGovernor.openWorkflowStudio` 会收到被点击的 tree node，而 controller 直接把原始入参当成 `VsCodeExtensionCommandRequest` 使用，没有解包其中的 `selectionRequest`。
- 影响: automation queue 的 inline action 可能重新打开到陈旧或空的 selection，而不是当前点击项，破坏 sprint-004 新增的插件主路径自动化跟进体验。
- 建议: 在 controller 中将 tree-node 形态的 VS Code 命令入参归一化为 `selectionRequest`，并补一条覆盖真实 inline-action 入参形态的回归测试。

## 3. Notes
1. reviewer 额外提示 cold-open 的 Workflow Studio / Review Detail 首次打开路径还没有专门的 fresh-window 测试，但在本轮边界内没有发现会阻断 sprint closeout 的新增缺陷。
2. 本轮 review 聚焦 sprint-004 owned boundary，未向 sprint-005 文档 truth 收口面扩展。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过，review 前基线）
2. `pnpm run build`（通过，review 前基线）
3. `pnpm run check`（通过，review 前基线）
4. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/tasks`（通过，review 前基线）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过，review 前基线）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，review 前基线）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过，review 前基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，review 前基线）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：VS Code tree-view 的 `view/item/context` 会把被点击的 `VsCodeExtensionTreeNodeDescriptor` 传给命令，当前实现没有把其中的 `selectionRequest` 解包出来，确实会让 automation queue 的 inline action 丢失点击项上下文。
   - 处理：已接受，修复为 controller 统一归一化 tree-node 入参，并补充覆盖 inline-action 实际入参形态的回归测试。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`pnpm run build`、`pnpm run check`（通过）
   - 说明：`openWorkflowStudio` 与 `openReviewDetail` 现在会先把 tree-node context-menu 入参归一化为 `selectionRequest`，从而保持 automation follow-up 的插件主路径上下文稳定。

## 处置结果与剩余风险

1. 本轮 accepted finding 已修复并重跑 targeted tests、`pnpm run build`、`pnpm run check`。
2. automation queue 的 inline action 现在与 row-click path 使用同一份 selection contract，不再因为 VS Code context-menu 入参形态不同而丢上下文。
