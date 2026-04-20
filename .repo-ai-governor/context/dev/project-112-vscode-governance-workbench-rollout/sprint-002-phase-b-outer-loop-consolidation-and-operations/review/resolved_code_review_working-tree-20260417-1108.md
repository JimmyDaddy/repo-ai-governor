# Code Review: TK-938 round 1

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-001`
- Review Type: delegated fresh review
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
2. `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
4. `packages/orchestration-service-client/src/**`

## 2. Findings

### 2.1 [P1] Temporary bridge preview commands drifted from the public CLI contract

- 位置:
  - `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
  - `apps/cli/src/main.ts`
- 问题描述:
  新增 temporary bridge catalog 里预填的 `adopt apply --selector ...` 与 `host * --repo .` 命令不符合当前公开 CLI 契约；这些命令会在 parser 层直接报 `unknown option`，导致 VS Code bridge staging 暴露的是不可用命令模板。
- 影响:
  `typed CLI bridge governance baseline` 无法真正执行，用户点击临时 bridge 后得到的是失败命令，违背了 Phase B “可回链、可验证、仅不自动执行”的 baseline。
- 建议:
  将 preview command line 改为当前 CLI 支持的真实模板或 help example，并补一个回归测试，锁住 bridge catalog 与 CLI 公开命令面的契约一致性。

### 2.2 [P2] Automation queue selection can lose detail/actions outside the execution-board window

- 位置:
  - `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`
  - `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
- 问题描述:
  automation queue 节点只保留 `executionId`，而 review detail hydration 只从 `queryExecutionBoard(limit=20)` 查 execution；当队列项对应 execution 不在最近 20 条窗口内时，detail view 会拿不到 selected execution，也丢失 service-owned actions / handoff targets。
- 影响:
  backlog 较大时，合法的 overdue automation item 可能在 workbench 中可见却无法稳定 drill down，削弱 queue/workbench baseline 的可用性与可信度。
- 建议:
  为 queue-driven selection 保留 service-owned queue entry，并在 execution-board miss 时走 exact `getExecution()` fallback；同时补回归测试覆盖 older automation item 的 detail hydration。

## 3. Notes

1. 第二条属于 risk-based inference，但基于当前 selection/runtime 代码路径可直接复现成可执行修复项，按 actionable 处理。

## 4. Verification

1. `pnpm run build`（已通过，进入本轮 review 前取得）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（已通过，进入本轮 review 前取得）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：temporary bridge catalog 已改为当前 CLI help appendix 中存在的真实命令模板，不再使用 `--selector` 或 `host * --repo .` 这类无效参数；`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts` 已增加命令模板回归断言。
   - 处理：按 accepted finding 修复。
2. `2.2`
   - 判定：**认可**
   - 证据：VS Code selection/runtime 现在会保留 queue-driven service-owned queue entry，并在 execution-board miss 时走 exact `getExecution()` fallback；`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts` 已覆盖 older automation item detail hydration 场景。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`pnpm run build`（通过）
   - 说明：bridge preview command line 已切换到当前 public CLI 支持的模板，并由 queue-overview 单元测试锁住契约。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`、`apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-selection-store.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`pnpm run build`（通过）
   - 说明：queue-driven selection 现在会保留 service-owned queue entry，并在 board window miss 时用 exact execution lookup + queue action/handoff metadata 保持 detail/action continuity。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复并复核完成，当前剩余动作是发起 fresh reviewer recheck，确认最新实现无新增 actionable finding。
