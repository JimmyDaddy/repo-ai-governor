# Code Review: sprint-001 contract/bootstrap/readiness cutover working tree recheck

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: working tree review
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

1. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
2. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`

## 2. Findings

### 2.1 [P1] Cancelled workflow template prompts still executed the runtime default operation
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:233`
- 问题描述: workflow preview/create/edit 之前把“输入框被 dismiss”与“用户提交空字符串以使用默认模板”都压成了 `undefined`，然后继续调用 `runWorkspaceOperationWithFeedback(...)`。
- 影响: 用户按 `Esc` 取消 `workflow create/edit` 时，命令仍可能创建或改写 workflow artifact，属于非预期有副作用执行。
- 建议: 把 dismiss/cancel 与 empty/default 显式区分；cancel 直接终止命令，不再触发 service dispatch，并补回归测试。

### 2.2 [P2] Direct workspace commands bypassed governed error handling
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:207`
- 问题描述: `runWorkspaceBootstrap`、`runDoctor`、`runCheck`、`runWorkflowPreview`、`runWorkflowCreate`、`runWorkflowEdit` 之前直接 await `runWorkspaceOperationWithFeedback(...)`，没有把 sidecar/service rejection 收敛到 `showCommandError(...)`。
- 影响: zero-CLI 主路径在 sidecar 离线、模板参数非法或 service seam 拒绝时，会直接冒裸的 VS Code command failure，而不是 extension 自己承诺的 governed/localized error path。
- 建议: 把这些直连命令统一包进带错误收敛的 helper，并为 rejection path 增加测试。

### 2.3 [P2] Unknown workspace-operation kinds silently downgraded to workflow preview
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:475`
- 问题描述: `buildOperationArgs()` 的 `default` 分支之前会把任何未知 `operationKind` 静默路由到 `workflow preview`。
- 影响: 这是跨进程 typed seam；一旦 extension/service 版本漂移或 payload 构造错误，service 会执行错误命令并返回误导性的 artifact/check，而不是 fail closed。
- 建议: 显式保留 `WORKFLOW_PREVIEW` case，并在 `default` 分支抛出 unsupported-operation 错误；补一个未知 kind 的防回归测试。

## 3. Notes

1. fresh reviewer round 2 的 3 条 actionable findings 都已在同一修复窗口闭环，没有遗留 `deferred` 项。
2. 本轮修复继续保持 sprint-001 的边界，只收敛 command/runtime 合约，不把后续 sprint 的 doctor/check/bootstrap 主能力扩展提前混入。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
3. `pnpm run build`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`promptForWorkflowTemplateId()` 现在把 `showInputBox()` 的 dismiss/cancel 显式映射为 `null`；`runWorkflowPreview/Create/Edit` 在收到 `null` 时直接 `return`，而对显式空字符串仍继续走 runtime default。新增测试覆盖了 cancel 与 empty 两种路径。
   - 处理：已接受并修复。
2. `2.2`
   - 判定：**认可**
   - 证据：direct workspace commands 现在统一经过 `runWorkspaceOperationWithHandledError(...)`，service rejection 会落到同一条 localized governed error path；新增测试证明 `runWorkspaceBootstrap()` 在 sidecar 离线时不会抛裸异常，而会显示标准化错误消息。
   - 处理：已接受并修复。
3. `2.3`
   - 判定：**认可**
   - 证据：`LocalOrchestrationServiceWorkspaceOpsRuntime.buildOperationArgs()` 现在显式保留 `WORKFLOW_PREVIEW` case，并在 `default` 分支抛出 `AGENT_PROTOCOL_INVALID`；新增测试覆盖未知 `operationKind` 会 fail closed。
   - 处理：已接受并修复。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
   - 说明：cancel 与 empty/default 已经被拆成两条不同语义路径，取消不会再触发 workflow mutation。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
   - 说明：direct workspace commands 现在不会把 raw service rejection 暴露给用户，而会统一通过 governed error UX 收敛。
3. `2.3`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：workspace-operation seam 对未知 kind 改成 fail closed，避免跨进程版本漂移时执行错误命令。
