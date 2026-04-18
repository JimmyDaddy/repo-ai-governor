# Code Review: sprint-001 contract/bootstrap/readiness cutover working tree

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-001`
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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/src/constants/vscode-extension.constant.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
4. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
5. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
6. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
7. `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
8. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
9. `packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts`
10. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`

## 2. Findings

### 2.1 [P1] Temporary bridge preview metadata was not preserved into service execution
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:175`
- 问题描述: temporary bridge 之前只把 `capabilityClass -> operationKind` 映射到 service runtime，未保留 preview 对应的 `outputDir / host / bundleDir / packSelector / reportPath` 等具体参数，导致实际执行可能回退到 runtime 默认值而偏离 preview 命令展示的目标。
- 影响: 用户在 VS Code 里看到的 preview command 与真正执行的 host/adoption target 可能不一致，receipt/backlink 也会落到错误的 artifact 路径。
- 建议: 让 service bridge DTO 显式投影 `operationKind + operationArguments`，并由 extension 原样转发到 `runWorkspaceOperation(...)`。

### 2.2 [P1] Upgrade apply path auto-approved a high-risk mutation
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:435`
- 问题描述: `UPGRADE_APPLY` 之前无条件补上 `--confirm-upgrade approve`，同时 extension 也会把 upgrade temporary bridge 直接映射到 apply，导致高风险升级路径缺少显式人工确认。
- 影响: 插件可以在没有 operator 明确认可的情况下直接执行 upgrade apply，违反 high-risk mutation 的受治理路径要求。
- 建议: service runtime 只接受 caller 显式提供的 `confirmUpgrade` 决策；VS Code 命令控制器在 dispatch apply 之前必须弹出确认。

### 2.3 [P2] Bootstrap readiness probe failures could blank overview/workflow restore
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:587`
- 问题描述: `queryBootstrapReadiness()` 之前直接返回 sidecar promise；当 workbench overview / workflow studio 通过 `Promise.all(...)` 一起恢复 snapshot 时，readiness probe 的瞬时失败会拒绝整个 restore 流程。
- 影响: 临时的 sidecar/readiness 抖动会让 workbench overview 和 workflow studio 一起掉成 restore failure，而不是降级为缺少一块 additive readiness 面板。
- 建议: 在 readiness 查询层把失败收敛为 `undefined`，只省略 bootstrap 卡片，不允许打断其余 editor-local/service-backed snapshot。

## 3. Notes

1. fresh reviewer round 1 的 3 条 actionable findings 都已在同一修复窗口闭环，没有留下 `deferred` 项。
2. 本轮修复保持了 `truth_owner=local_orchestration_service` 的边界：extension 只转发 service-owned typed DTO，不直接回退为用户可见 CLI shell。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
3. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
4. `pnpm run build`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`OrchestrationGovernanceTemporaryBridgeEntry` 现已显式携带 `operationKind + operationArguments`；`LocalOrchestrationServiceGovernanceTemporaryBridgeCatalog` 会为 adopt/host/upgrade bridge 产出与 preview 对齐的 typed args，`VsCodeExtensionCommandController.stageTemporaryBridge()` 也会原样把这些 args 传给 `runWorkspaceOperation(...)`。
   - 处理：已接受并修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`LocalOrchestrationServiceWorkspaceOpsRuntime` 现在在缺少 `confirmUpgrade` 时抛出显式错误，不再默认 `approve`；`VsCodeExtensionCommandController` 对 upgrade bridge 增加了 modal confirm，只有 operator 明确点击 `Apply Upgrade` 才会把 `confirmUpgrade=approve` 发给 service seam。
   - 处理：已接受并修复。
3. `2.3`
   - 判定：**认可**
   - 证据：`VsCodeExtensionServiceRuntime.queryBootstrapReadiness()` 现在会在 client 不可用或 probe 失败时返回 `undefined`；新增的 overview/workflow 回归测试证明 restore 仍能成功返回 snapshot，而不是被 readiness failure 打断。
   - 处理：已接受并修复。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
3. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
4. `pnpm run build`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、对应扩展/服务测试
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：preview 和 execution 现在共享同一组 typed bridge metadata，不再由 controller 重新猜默认参数。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、对应扩展/服务测试
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`（通过）
   - 说明：upgrade apply 只有在插件里明确确认后才会带着 `confirmUpgrade` 进入 service seam；取消确认不会触发 apply。
3. `2.3`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）
   - 说明：bootstrap-readiness probe 失败会被降级为 additive omission，overview/workflow restore 继续返回可渲染 snapshot。
