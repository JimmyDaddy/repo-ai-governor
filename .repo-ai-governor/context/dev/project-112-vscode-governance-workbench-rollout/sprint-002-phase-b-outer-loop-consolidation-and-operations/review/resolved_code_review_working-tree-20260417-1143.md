# Code Review: TK-938 round 3

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-003`
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
3. `packages/orchestration-service-client/src/**`

## 2. Findings

### 2.1 [P1] Queue-driven older-item detail still loses queue action continuity after the first render

- 位置:
  - `apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
- 问题描述:
  当前 queue fallback 只在 `selection.queueEntry` 还存在时才能补回 actions / handoff targets，但 `review-detail` 首次 render 后会调用 `rememberExecution()`，把 queue selection 信息清掉；下一次 refresh/re-render 又会退回到 empty queue context。
- 影响:
  older automation/review item 首次打开看起来正常，但再次刷新就会回到空 action/handoff，导致 round 1 修复的 continuity 只生效一次。
- 建议:
  在 queue-driven fallback 被命中时保留可重建的 queue selection token，直到显式切换到其他 selection，再补一个“首屏打开后再次 refresh”回归测试。

### 2.2 [P2] Temporary bridge command is exposed in the Command Palette without any persisted bridge selection

- 位置:
  - `apps/vscode-extension/package.json`
  - `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
  - `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
- 问题描述:
  `repoAiGovernor.stageTemporaryBridge` 已作为命令贡献到 VS Code，但 handler 只读取显式 `commandRequest.temporaryBridge`；当前 host 不会记录 workbench overview 里的 temporary bridge selection，palette 触发几乎总是拿不到 bridge。
- 影响:
  新增 entrypoint 在 Command Palette 中是死入口，除非用户直接点树节点命令，不符合“已贡献 command 即可用”的基本 UX 约束。
- 建议:
  为 temporary bridge 增加 selection-backed state，并在 workbench overview selection 时写入；`stageTemporaryBridge()` 在无显式参数时应回退到当前 selection。

## 3. Notes

1. 第二条属于 risk-based inference，但与当前已发布 command contribution 的实际行为直接冲突，继续按 actionable 处理。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（已通过，进入本轮 review 前取得）
2. `pnpm run build`（已通过，进入本轮 review 前取得）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：review detail provider 现会在 queue fallback 命中时保留 queue selection token，`rememberReviewSourcePath()` 也不再把 queue selection 连带清空；新增回归测试覆盖“older queue item 首次 render 后再次 refresh 仍保留 queueEntry”。
   - 处理：按 accepted finding 修复。
2. `2.2`
   - 判定：**认可**
   - 证据：temporary bridge selection 已扩展为 selection-backed state，host 新增 workbench overview selection handler，`stageTemporaryBridge()` 在无显式参数时会回退到当前选中的 bridge；新增 palette-style regression test 已覆盖。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-review-detail-provider.ts`、`apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-selection-store.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`pnpm run build`（通过）
   - 说明：queue-driven fallback 现在不仅首屏可用，而且跨后续 refresh / rerender 仍保留 queue action continuity。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/src/runtime/vscode-extension-host.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`pnpm run build`（通过）
   - 说明：temporary bridge command 现在既能从树节点直接执行，也能在选中 bridge 后通过 Command Palette 正常落终端。

## 处置结果与剩余风险

1. 本轮 accepted findings 已修复并复核完成，剩余唯一动作是再次发起 fresh clean recheck；clean 后即可将 `TK-938` 切换为 `completed`。
