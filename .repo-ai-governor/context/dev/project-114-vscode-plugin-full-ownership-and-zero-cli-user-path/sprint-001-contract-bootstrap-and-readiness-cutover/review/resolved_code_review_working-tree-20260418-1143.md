# Code Review: sprint-001 contract/bootstrap/readiness cutover working tree recheck

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-006`
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

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
2. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`

## 2. Findings

### 2.1 [P1] Run Doctor skipped adapter-readiness verification
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:382`
- 问题描述: `OrchestrationWorkspaceOperationKind.DOCTOR` 被映射成裸 `doctor`，但当前仓库的人类可见 doctor/readiness 入口仍以 `doctor --adapters --output pretty` 作为 adapter 证据面；service-native cutover 因此会漏掉 adapter 验证。
- 影响: VS Code 内的 zero-CLI doctor 流程可能显示 readiness 已检查，但实际没有采集 adapter-readiness 证据，削弱 sprint-001 的 bootstrap/readiness 验收真实性。
- 建议: 将 doctor workspace op 对齐到 adapter-readiness argv，并补一个回归测试锁定该 contract。

### 2.2 [P2] Bootstrap readiness tooltip leaked internal action ids and untranslated zh-CN copy
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts:1083`
- 问题描述: bootstrap readiness 节点直接把 `recommendedActions` 原始 action id 拼进 tooltip，同时 zh-CN label 仍然保留英文 `Bootstrap readiness`。
- 影响: workbench onboarding UI 会把内部 machine id 暴露给终端用户，且中文界面出现未本地化标签，违反 `CS-033` 的用户文案约束。
- 建议: 把 readiness action code 映射成用户可理解的本地化 guidance，并补中英文 presenter 测试。

## 3. Notes

1. fresh reviewer round 6 另外提示了 `packages/core-orchestration-service/package.json` 未声明 `@repo-ai-governor/cli` 依赖的跨包风险；当前轮次先记为 residual packaging risk，不作为 sprint-001 closeout blocker。
2. 当前 round 未发现 task-ledger、review lifecycle 或 sprint plan status 的同步漂移。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check`（通过）

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`buildOperationArgs()` 当前确实把 `DOCTOR` 映射成 `['doctor']`，而 session-main doctor 入口和 CLI doctor command 都仍要求 `--adapters` 才会执行 adapter verification。
   - 处理：接受修复，已将 doctor workspace op 对齐到 adapter-readiness argv，并补回归测试。
2. `2.2`
   - 判定：**认可**
   - 证据：bootstrap readiness 节点直接渲染 `recommendedActions.join(', ')`，并且中文 label 仍写成英文；这属于用户可见 interactive copy。
   - 处理：接受修复，已改成本地化 label 和用户导向 action guidance，并补 zh-CN presenter 测试。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
   - 说明：doctor workspace op 现在固定复用 adapter-readiness argv，不再把 zero-CLI doctor 路径降级成少证据的裸 `doctor` 调用。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test packages/core-orchestration-service/test/local-orchestration-service-governance-temporary-bridge-catalog.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`（通过）
   - 说明：bootstrap readiness 节点已改为本地化 label 和用户导向 guidance，不再把内部 action id 直接暴露到 tooltip。
