# Code Review: TK-938 round 6

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-006`
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

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
3. `apps/vscode-extension/package.json`
4. `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`

## 2. Findings

### 2.1 [P1] VS Code sidecar still anchors bridge paths to the opened repo

- 位置:
  - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
- 问题描述:
  extension runtime 在创建 `LocalOrchestrationServiceSidecarClient` 时仍只使用当前打开的 workspace folder；这会让 temporary bridge catalog 在默认 `tool_managed` 下继续把 repo 根误当成 governance workspace，并把 export/verify/upgrade bridge 锚到 `repo/.repo-ai-governor/...`。
- 影响:
  VS Code workbench 在默认产品路径上仍会向错误的治理目录 staging bridge command，直接违反 brief 中“默认 `tool_managed` workspace 与 repo 分离”的契约。
- 建议:
  extension runtime 先解析出实际 governance workspace root，再把 `governanceWorkspaceRoot + repositoryRoot` 一起传给 sidecar client，并补一个 tool-managed regression test。

## 3. Notes

1. 本条是阻断性 P1，因为它影响的是 VS Code surface 上默认 `tool_managed` 路径，而不是单纯的测试注入分支。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：VS Code extension runtime 现在会先用 `WorkspaceResolver` 解析实际 governance workspace，再把 `governanceWorkspaceRoot + repositoryRoot` 一起传入 sidecar client；新增 tool-managed regression test 覆盖了 sidecar client 以外部 workspace root 启动而不是误用 repo 内 `.repo-ai-governor`。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`apps/vscode-extension/package.json`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`、`pnpm run build`（通过）
   - 说明：extension 侧不再把打开的 repo root 直接当成 sidecar workspace，而是显式解析默认 `tool_managed` / `repo_local` workspace contract 后再连接服务。

## 处置结果与剩余风险

1. 本轮 accepted finding 已修复并复核完成；`TK-938` 仍需再跑一轮 fresh clean recheck，确认 extension/runtime/bridge boundary 已无新的 actionable finding。
