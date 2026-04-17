# Code Review: TK-938 round 2

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-002`
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

1. `apps/vscode-extension/**`
2. `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
4. `packages/orchestration-service-client/src/**`

## 2. Findings

### 2.1 [P1] Temporary bridge staging still targets the governance workspace instead of the governed repo

- 位置:
  - `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
  - `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
- 问题描述:
  当前 temporary bridge contract 只携带一个 `workspaceRoot`，VS Code staging 会直接拿它作为 terminal `cwd`。在当前 service/runtime 语义下，这个 root 可能是 governance workspace（`.repo-ai-governor`），而不是受治理 repo 根；同时 preview command 里仍有依赖相对路径基准的 `.repo-ai-governor/...` 片段。
- 影响:
  bridge command 即使命令参数已变成有效 CLI，也可能在错误目录执行，导致 `--repo .`、`--output-dir .repo-ai-governor/...` 或 upgrade report 路径落到错误基准，破坏 Phase B “可执行 typed bridge” 的真实性。
- 建议:
  在 temporary bridge contract 中显式区分 command working directory 与 governance workspace root，采用 repo-root `cwd` + 预解析后的绝对治理路径，并补回归测试覆盖该基准选择。

## 3. Notes

1. 该问题属于 risk-based inference，但与当前 root-resolution 代码路径直接相关，继续按 actionable 处理。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（已通过，进入本轮 review 前取得）
2. `pnpm run build`（已通过，进入本轮 review 前取得）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：temporary bridge contract 现已显式区分 governance workspace root 与 terminal command working directory；`adopt` 命令改用 repo-root `--repo`，`host/upgrade` 的治理路径改为预解析绝对路径，`stageTemporaryBridge()` 也改为使用 command-working-directory 开终端。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`pnpm run build`（通过）
   - 说明：temporary bridge 现在以 repo-root `cwd` 执行，并把 governance output/report path 预解析到绝对路径，避免治理目录和受治理 repo 根混淆。

## 处置结果与剩余风险

1. 本轮 accepted finding 已修复并复核完成，下一步进入 fresh clean recheck；只有 reviewer round 返回无 actionable finding，`TK-938` 才能进入 `completed`。
