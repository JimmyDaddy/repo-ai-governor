# Code Review: TK-938 round 8

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-008`
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

1. `packages/config/src/workspace-config-discovery-service.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
3. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`

## 2. Findings

### 2.1 [P1] Nested custom `governor.yaml` can hijack repo-opened workspace discovery

- 位置:
  - `packages/config/src/workspace-config-discovery-service.ts`
  - `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
- 问题描述:
  round-7 的 discovery fallback 在默认 shadow config 缺失时会递归扫描整个 repo，并接受第一个“自洽”的 custom repo-local `governor.yaml`；这允许无关 fixture 或 sample workspace 误被认领为 active governance workspace。
- 影响:
  VS Code workbench 可能绑定到错误的治理目录，导致 queue/review/temporary bridge surface 读取到不相关的治理状态，属于阻断性 bootstrap 风险。
- 建议:
  自动发现必须 fail closed：仅允许具备 canonical workspace marker 的唯一 repo-local candidate 被认领；若候选不具备真实 workspace marker 或出现歧义，则回退到显式 anchor 路径而不是猜测。

## 3. Notes

1. 本条是阻断性 P1，因为它会让 repo-opened host 在无显式授权的情况下绑定到错误 governance workspace，而不是单纯的体验问题。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：shared discovery 现在只会接受“具备 canonical workspace marker 的唯一 repo-local candidate”，否则直接 fail closed；新增回归同时覆盖了“真实 custom repo-local workspace 可发现”和“无关 nested fixture 不会 hijack”两条路径。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/config/src/workspace-config-discovery-service.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`、`pnpm run build`（通过）
   - 说明：repo-opened discovery 不再递归认领任意自洽 descendant config，而是只接受具备真实 workspace marker 的唯一 candidate，歧义场景直接回退到安全默认路径。

## 处置结果与剩余风险

1. 本轮 accepted finding 已修复并复核完成；`TK-938` 仍需进入下一轮 fresh clean recheck，只有最新 reviewer round 返回无 actionable finding 时才能进入 sprint closeout。
