# Code Review: TK-940 workflow studio desktop decision and support-truth evidence

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/package.json`
2. `apps/vscode-extension/src/constants/vscode-extension.constant.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-contract.ts`
5. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
6. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
7. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
8. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
9. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
10. `apps/vscode-extension/test/vscode-extension-contract.test.ts`
11. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
12. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
13. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`

## 2. Findings

### 2.1 [P2] Workflow-studio support-truth gate ignores the selected execution stage

- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
- 问题描述: `buildWorkflowStudioHtml()` 在构造 `Support-truth gate` 区块时，没有把 `selectedExecution.execution.currentStageId` 传入 `buildWorkflowStudioSupportTruthLines()`，导致 helper 固定以 `undefined` 计算 gate 状态。
- 影响: 当 `temporaryBridges` 已清空但 service-backed workflow stage 已经可以进入 support-truth review 时，workflow-studio evidence surface 仍会展示 `Evidence in progress`，从而落后于 service-owned stage truth。
- 建议: 把 selected execution summary 传入 support-truth gate 计算逻辑，并补一条覆盖 “`temporaryBridges=[] + currentStageId 已存在`” 的回归测试。
- 规范依据:
  - `contract.runtime.vscode-governance-workbench-surface.v1` Required Constraints `4/6`
  - `contract.runtime.governance-workbench-aggregation-facade.v1` Required Constraints `3`

## 3. Notes

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts` 中仍有 `Phase B` tooltip 文案漂移，但本轮未将其提升为 blocker。
2. 当前 scope 内未发现 VS Code 直接读取 `.repo-ai-governor/**` canonical files 的问题，整体仍保持 service-backed presenter owner split。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（review baseline，已通过）
2. `pnpm run build`（review baseline，已通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`buildWorkflowStudioHtml()` 在本轮实现里已经解析 `selectedExecution`，但 `buildWorkflowStudioSupportTruthLines()` 仍固定把 gate 计算锚定到 `undefined`，会在 `temporaryBridges=[]` 时继续丢失 service-backed stage truth。
   - 处理：接受该 finding，修复 presenter 参数传递并补一条 ready-branch 回归测试。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（baseline 已通过；修复后需重跑）
2. `pnpm run build`（baseline 已通过；修复后需重跑）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）；`pnpm run build`（通过）
   - 说明：已把 `selectedExecution` 传入 support-truth gate 计算逻辑，并补充 “无 temporary bridge + 已有 currentStageId” 的回归覆盖；同时清理了 `Phase B` tooltip 文案漂移。

## 处置结果与剩余风险

1. 已接受 finding 全部完成处理，workflow-studio evidence surface 现在能够在 bridge backlog 清空时反映 service-backed stage readiness。
2. 当前 review scope 内未发现剩余需要继续阻断 `TK-940` 的 actionable finding。
