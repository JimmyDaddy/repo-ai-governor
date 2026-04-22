# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 9

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-009`
- Review Type: delegated sprint recheck
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
1. `packages/orchestration-service-client`
2. `packages/core-orchestration-service`
3. `apps/vscode-extension/src/runtime`
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline`

## 2. Findings
### 2.1 [P3] Localize workflow-draft entry-mode labels in the overwrite confirmation
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:4039`
- 问题描述: 覆盖确认框直接插入了协议枚举 `read_only / create_seed / edit_seed`，而不是面向用户的本地化动作名称。这条文案属于 VS Code 交互 UX，不是 machine-only 输出。
- 影响: 用户会在确认框里看到协议值而不是产品文案，既影响可理解性，也违反 `CS-033` 对 `apps/**` 用户可见文本必须经 i18n/runtime bridge 的要求。
- 建议: 在 command controller 中把 workflow-draft entry mode 映射为本地化 display label，再用于 overwrite confirmation。

### 2.2 [P3] Workflow Studio summary still shows raw workflow-draft conflict enums
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts:4230`
- 问题描述: Workflow Studio 的 draft summary 直接展示 `conflictKind` 原始枚举，例如 `base_definition_changed`。这也是用户可见的 webview summary 文案，不应暴露协议标识符。
- 影响: 用户会在冲突态 summary 中读到协议枚举而不是可理解的产品文案，同样违反 `CS-033` 的用户可见文本治理要求。
- 建议: 在 presentation builder 中补 conflict kind 的本地化投影，并在 summary 渲染中统一复用。

## 3. Notes
1. fresh delegated reviewer round surfaced `2 x P3` user-facing i18n findings after `CR-008` resolved；两项都直接命中 `CS-033`，因此按 accepted 进入主 agent 复核。
2. reviewer 同时确认 reviewed scope 内未再出现新的 correctness/regression risk finding；当前剩余问题集中在用户可见文本投影层。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:desktop-entry-smoke`（通过）
6. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：overwrite confirmation 属于直接展示给用户的交互文案，当前确实插入了原始 `entryMode` 枚举值；这条路径命中 `CS-033`。
   - 处理：accepted，补 controller 侧本地化 entry-mode label，再补回归断言，避免提示框继续泄露协议值。
2. `2.2`
   - 判定：**认可**
   - 证据：Workflow Studio summary 直接渲染 `conflictKind` 原始枚举值；这也是用户可见的 webview 文案，同样命中 `CS-033`。
   - 处理：accepted，补 presentation builder 的 conflict-kind 本地化投影，并用 summary 回归测试锁住。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：overwrite confirmation 现在会把 entry mode 投影为本地化的用户动作名称，不再把 `read_only / create_seed / edit_seed` 暴露到交互提示里。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：Workflow Studio summary 现在会把 conflict kind 投影为本地化冲突文案，不再直接显示 protocol enum。

## 风险与后续（2026-04-22）

1. `CR-009` 的两条 accepted i18n findings 已修复并完成同窗 build/package/smoke/targeted/gov verification。
2. fresh reviewer round 9 没有再指出新的 correctness/regression 问题；若当前 project/sprint 继续保持 clean，可进入 `TK-1040` sprint-002 closeout 与 sprint-003 handoff 判断。
