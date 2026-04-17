# Code Review: TK-938 round 9

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-009`
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

1. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
4. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
5. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
6. `packages/config/src/workspace-config-discovery-service.ts`

## 2. Findings

### 2.1 [P2] Queue-only handoff selections still lose their handoff target on command fallback

- 位置:
  - `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
  - `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
- 问题描述:
  `Open Governor Handoff Target` 在没有显式 handoff target 参数时，只会回看 execution-board handoff targets，而不会优先消费 queue-selected item 自身已经携带的 handoff target。
- 影响:
  对于超出 execution-board window 的旧 queue item，用户会收到“没有可用 handoff target”的错误提示，尽管 queue selection 本身已经持有合法目标。
- 建议:
  优先消费 `queueEntry.handoffTargets`，只有缺失时再回退到 execution-board lookup，并补 queue-only regression test。

### 2.2 [P2] `CS-027` temporary exception and decomposition plan were missing for the enlarged presentation builder

- 位置:
  - `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
  - `TK-938`
- 问题描述:
  Phase B 把 automation/workbench/bridge shaping 继续叠加到超大 `presentation-builder` 文件中，但此前没有按 `CS-027` 记录临时例外标记，也没有在当前 task ledger 中登记后续拆分计划。
- 影响:
  交付会违反仓库级 God-object guardrail 的例外治理要求，即使功能正确也不能宣称 clean delivery。
- 建议:
  在代码邻近处补 `god-object-exception: TK-938 ...` 标记，并在 `TK-938` 中登记与 `sprint-003 / TK-940` 对齐的 focused builder 拆分计划。

### 2.3 [P3] Repo-opened workspace discovery was recomputed on every VS Code service call

- 位置:
  - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
- 问题描述:
  repo-opened service runtime 在每次 query/refresh 时都会重新解析 workspace context，并在默认 shadow config 缺失时重复递归 discovery。
- 影响:
  在大型 repo 中，这会让一次 workbench refresh 付出多次重复 bootstrap 成本，属于会随使用频率放大的性能风险。
- 建议:
  按 opened workspace root 缓存 resolved service workspace context，并在 `dispose()` 或 workspace 变化时失效。

## 3. Notes

1. 本轮是以 clean recheck 的标准复核 Phase B outer-loop baseline，所以即使是 P2/P3，只要影响真实命令路径、治理例外合规或明显的 refresh 级性能行为，仍视为 actionable finding。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：handoff command 现在会先消费 queue-selected handoff targets，再回退到 execution-board lookup；新增 queue-only handoff regression test 覆盖了旧 queue item 的无显式参数路径。
   - 处理：按 accepted finding 修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`presentation-builder` 邻近新增了 `god-object-exception: TK-938` 标记，`TK-938` 任务卡补登记了与 `sprint-003 / TK-940` 对齐的 focused builder 拆分计划。
   - 处理：按 accepted finding 修复。
3. `2.3`
   - 判定：**认可**
   - 证据：VS Code runtime 现在按 opened workspace root 缓存 resolved service workspace context，并在 `dispose()` 时清理；新增 runtime regression test 验证重复 query 不会重复解析同一 opened workspace。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、full vitest bundle、`pnpm run build`（通过）
   - 说明：queue-only handoff 现在不会因为 execution-board window miss 而丢失已知目标。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`TK-938`
   - 验证：full vitest bundle、`pnpm run build`（通过）
   - 说明：Phase B 的临时例外与后续 focused builder 拆分计划已经补齐到代码邻近和任务台账两处。
3. `2.3`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、full vitest bundle、`pnpm run build`（通过）
   - 说明：同一 opened workspace root 的 service workspace context 现在被缓存，避免重复 refresh 时反复做 repo-opened discovery。

## 处置结果与剩余风险

1. 本轮 accepted findings 已修复并复核完成；`TK-938` 仍需进入下一轮 fresh clean recheck，只有最新 reviewer round 返回无 actionable finding 时才能进入 sprint closeout。
