# Code Review: TK-938 round 4

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-004`
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
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. Review Scope

1. `apps/cli/src/runtime/orchestration-service-runtime.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts`
6. `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
7. `packages/core-orchestration-service/src/types/interfaces/*.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`

## 2. Findings

### 2.1 [P1] Temporary bridge repo-target still defaults to the workspace container in `tool_managed`

- 位置:
  - `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
  - `apps/cli/src/runtime/orchestration-service-runtime.ts`
- 问题描述:
  temporary bridge catalog 仍通过 `dirname(workspaceRoot)` 猜 `commandWorkingDirectory` 和 adopt/apply 的 `--repo` 参数；在默认 `tool_managed` 布局下，这个父目录是工具托管容器分区，不是被治理仓库根目录。
- 影响:
  staged bridge command 会指向错误仓库，直接破坏 governed repo truth，并让 VS Code workbench 的 typed bridge contract 与 PRD 中的 workspace/repo boundary 失真。
- 建议:
  从 authoritative runtime context 显式把 `repositoryRoot` 传入 orchestration service shell / sidecar / temporary bridge catalog，bridge 只消费该事实，不再本地猜测。

### 2.2 [P2] Upgrade bridge still stages a placeholder report path instead of runtime state

- 位置:
  - `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
- 问题描述:
  upgrade bridge 继续硬编码 `upgrade-1234567890.report.json`，不是当前 workspace `context/upgrade/` 里的真实 report artifact。
- 影响:
  workbench surface 暴露的是不可运行的示例命令，既没有 receipt/backlink 可追溯性，也会让 typed bridge baseline 假装存在一条尚未生成的 upgrade path。
- 建议:
  运行时只在存在真实 upgrade report 时投影该 bridge，并解析当前可用 artifact path；若没有 report，则不要暴露 upgrade bridge。

## 3. Notes

1. 本轮因 reviewer 指向 `tool_managed` 下的 repo/workspace 边界语义，已按 `runtime_contract_change` 补载 overall solution 与 architecture/layering 文档后再做处理。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：CLI runtime 现把 `repositoryRoot` 作为显式依赖传入 local orchestration service；shell 再把该事实继续传给 queue overview runtime 与 temporary bridge catalog，sidecar 也通过 env/entry path 保持同一契约；shell unit test 已覆盖 `tool_managed` governance workspace 与 governed repo 分离时仍输出 repo-root command。
   - 处理：按 accepted finding 修复。
2. `2.2`
   - 判定：**认可**
   - 证据：upgrade bridge 改为只解析 `context/upgrade/` 下真实存在的最新 report artifact；若没有 report，不再投影 upgrade bridge；新增 shell unit test 已覆盖 suppress 行为。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`apps/cli/src/runtime/orchestration-service-runtime.ts`、`apps/cli/src/types/interfaces/cli-orchestration-service-runtime.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`、`packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`、`packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts`、`packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-shell.interface.ts`、`packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`pnpm run build`（通过）
   - 说明：temporary bridge 不再从 workspace container 猜 repo root，而是沿 runtime contract 传递 governed repository root。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`pnpm run build`（通过）
   - 说明：upgrade bridge 现在只投影真实 report artifact；没有 report 时不会制造假的 staged command。

## 处置结果与剩余风险

1. 本轮 accepted findings 已修复并复核完成；`TK-938` 仍需再跑一轮 fresh clean recheck，确认已无新的 actionable finding。
