# Code Review: TK-938 round 5

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-005`
- Review Type: delegated fresh recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `apps/cli/src/runtime/orchestration-service-runtime.ts`
2. `apps/cli/src/types/interfaces/cli-orchestration-service-runtime.interface.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
6. `apps/cli/test/runtime/orchestration-service-runtime.test.ts`
7. `apps/cli/test/runtime/session-main-parity.integration.test.ts`

## 2. Findings

### 2.1 [P2] Shell-staged bridge commands are not safe for paths with spaces

- 位置:
  - `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
- 问题描述:
  temporary bridge preview command 仍把绝对路径直接插入 shell 字符串，而 VS Code command controller 会把该字符串原样 `sendText(..., false)` 到终端；repo/workspace/report path 一旦包含空格或 shell metacharacter，`--repo`、`--output-dir`、`--bundle-dir` 与 upgrade report 参数都会被错误切分。
- 影响:
  workbench 呈现的 typed bridge command 在常见路径布局下会变成不可运行的假命令，破坏“stage but do not auto-execute”这条 governed bridge baseline。
- 建议:
  用 shell-safe argv 渲染 preview command，并补一个 path-with-spaces 回归测试。

### 2.2 [P2] `serviceOwnerProvider` 仍然绕开新的 `repositoryRoot` contract

- 位置:
  - `apps/cli/src/runtime/orchestration-service-runtime.ts`
  - `apps/cli/src/types/interfaces/cli-orchestration-service-runtime.interface.ts`
- 问题描述:
  runtime 已计算 `repositoryRoot`，但 provider-backed branch 仍只把 `workspaceRoot` 传给 `serviceOwnerProvider`；这让一条一等运行时路径继续保留旧的 repo/workspace 猜测契约。
- 影响:
  自定义 owner 注入场景会重新引入 `tool_managed` 下的 repo-target 漂移，导致刚刚修复的 boundary 在 provider path 上失效。
- 建议:
  扩展 provider contract，把 `repositoryRoot` 也作为显式上下文传入，并同步修正测试注入路径。

## 3. Notes

1. 第一条属于 risk-based inference，但与 VS Code 当前 `sendText(..., false)` 的 staging 方式直接耦合，继续按 actionable 处理。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：temporary bridge preview command 已统一走 shell-safe argv 渲染；shell unit test 现在使用包含空格的 repo/workspace path，覆盖 adopt/host/upgrade staging 仍保持正确 quoting。
   - 处理：按 accepted finding 修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`serviceOwnerProvider` 已升级为显式 owner context，包含 `workspaceRoot` 与可选 `repositoryRoot`；CLI runtime 与相关测试注入路径都已同步到新契约。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`、`pnpm run build`（通过）
   - 说明：bridge command 现在是 shell-safe preview text，不会在包含空格的绝对路径上被终端错误拆参。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/orchestration-service-runtime.ts`、`apps/cli/src/types/interfaces/cli-orchestration-service-runtime.interface.ts`、`apps/cli/test/runtime/orchestration-service-runtime.test.ts`、`apps/cli/test/runtime/session-main-parity.integration.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`、`pnpm run build`（通过）
   - 说明：provider-backed owner path 也开始消费同一份 `repositoryRoot` runtime fact，不再保留旧的 workspace-only 注入通道。

## 处置结果与剩余风险

1. 本轮 accepted findings 已修复并复核完成；`TK-938` 仍需再跑一轮 fresh clean recheck，确认 bridge/queue/runtime boundary 已没有新的 actionable finding。
