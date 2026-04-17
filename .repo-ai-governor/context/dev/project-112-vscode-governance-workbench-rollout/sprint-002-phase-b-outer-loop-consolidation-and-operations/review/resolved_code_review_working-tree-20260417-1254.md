# Code Review: TK-938 round 7

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-007`
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
3. `packages/config/src/workspace-config-discovery-service.ts`
4. `packages/config/src/index.ts`

## 2. Findings

### 2.1 [P1] Custom `repoLocalRoot` workspaces still fall back to the wrong governance root

- 位置:
  - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
  - `packages/config/src/workspace-config-discovery-service.ts`
- 问题描述:
  extension runtime 当前只会优先探测默认 `.repo-ai-governor/governor.yaml`，因此当仓库把 repo-local workspace 切到自定义 `repoLocalRoot` 且没有保留默认 shadow config 时，VS Code sidecar 仍会回退到错误的 workspace root。
- 影响:
  这会让 queue、review、temporary bridge 等 VS Code workbench surface 连接到错误的治理目录，违反 shared config contract 中 `repoLocalRoot` 可配置的边界。
- 建议:
  把 repo-opened host 的 workspace config 发现逻辑上提到 shared config 层，允许在默认 shadow config 缺失时仍发现 repo 内真实的 custom repo-local `governor.yaml`，并补对应 regression test。

## 3. Notes

1. 本条是阻断性 P1，因为它会让 VS Code primary workbench 在合法配置下读取到错误的治理真值，而不是单纯的兼容性瑕疵。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：shared config 层新增 `WorkspaceConfigDiscoveryService`，先兼容默认 shadow config，再在缺失 shadow config 时发现 repo 内真实 custom repo-local `governor.yaml`；VS Code runtime 已改为使用该共享发现结果解析 governance workspace；新增 regression test 覆盖“custom `repoLocalRoot` + 默认 shadow config 缺失”的场景。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`packages/config/src/workspace-config-discovery-service.ts`、`packages/config/src/index.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`、`pnpm run build`（通过）
   - 说明：repo-opened host 不再只依赖默认 `.repo-ai-governor/governor.yaml` 作为唯一发现入口，而是通过 shared config discovery 解析实际 repo-local workspace root。

## 处置结果与剩余风险

1. 本轮 accepted finding 已修复并复核完成；`TK-938` 仍需进入下一轮 fresh clean recheck，只有最新 reviewer round 返回无 actionable finding 时才能进入 sprint closeout。
