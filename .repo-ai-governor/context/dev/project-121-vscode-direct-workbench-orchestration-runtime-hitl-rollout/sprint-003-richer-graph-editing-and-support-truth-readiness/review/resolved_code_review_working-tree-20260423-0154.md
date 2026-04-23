# Code Review: sprint-003 richer graph editing and support-truth readiness

- Status: resolved
- Date: 2026-04-23
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-selection-store.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
5. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
6. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
7. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
8. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
9. `scripts/release/verify-vscode-extension-distribution.js`
10. `test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
11. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`
12. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/**`

## 2. Findings

### 2.1 [P2] Workspace backlink was routed through the document handoff path

- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
- 问题描述: `focused backlink` action 对任意 absolute-path 非评审回链都统一映射到 `EDITOR`，而 service-owned HITL packet 会默认产出 `WORKSPACE` backlink，目标是 `execution.workspaceRoot`。这会把目录路径送进 `openTextDocument()`，导致打开失败。
- 影响: canonical `WORKSPACE` backlink 不能 round-trip 回 governed worktree，破坏 direct-workbench backlink contract。
- 建议: 将 `WORKSPACE` backlink 明确映射到 `WORKTREE` handoff，或在非文档目标上 suppress action，并补 workspace 分支回归。

### 2.2 [P3] Release smoke did not cover the default workspace-backlink branch

- 位置: `scripts/release/verify-vscode-extension-distribution.js`
- 问题描述: packaged Workflow Studio smoke 与集成测试只覆盖 review/artifact 风格的 backlink，没有覆盖 service 默认提供的 `WORKSPACE` backlink 分支。
- 影响: `release:verify-vscode-extension-distribution` 可能在 canonical workspace backlink 失效时仍然通过，削弱 sprint-003 readiness package 的 fail-closed 证据强度。
- 建议: 把 workspace backlink 纳入 packaged smoke fixture，并断言 focused handoff 会安全地回到 worktree。

## 3. Notes

1. delegated reviewer 未发现额外的 task-ledger、checklist、`tasks.csv` 或 sprint/project plan 漂移问题。
2. 本轮 readiness disposition 继续保持 `stay fail-closed`，没有发现新的 public/support truth 过度承诺。

## 4. Verification

1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
6. `pnpm run check:ide-entry-smoke`（通过）
7. `pnpm run check:desktop-entry-smoke`（通过）
8. `pnpm run release:verify-vscode-extension-distribution`（通过）
9. `pnpm run release:verify-host-distribution`（通过）
10. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks"`（通过）
11. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
12. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
13. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-23）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`WORKSPACE` backlink 由 service 默认产出，且 `openHandoffTarget()` 对 `EDITOR`/`REVIEW_DOCUMENT` 都走 `openTextDocument()`，因此目录目标确实会在现网分支失效。
   - 处理：将 `WORKSPACE` focused backlink 明确改为 `WORKTREE` handoff。
2. `2.2`
   - 判定：**认可**
   - 证据：packaged smoke 原先只验证 review-style handoff，未对 workspace backlink 做 fail-closed 断言。
   - 处理：扩展 packaged smoke fixture 和 integration test，覆盖 `workspace` backlink command 与 `worktree` handoff。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run release:verify-vscode-extension-distribution`（通过）

## 修复执行记录（2026-04-23）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：focused workspace backlink 现在生成 `WORKTREE` handoff target，并回归验证 `workflow-studio:workspace:/repo` 分支。
2. `2.2`：已完成
   - 变更文件：`scripts/release/verify-vscode-extension-distribution.js`、`test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run release:verify-vscode-extension-distribution`（通过）
   - 说明：packaged Workflow Studio smoke 现在同时要求 review-focus command、workspace-focus command 与 safe worktree handoff action。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复，`CR-001` 可以收口为 `resolved`。
2. sprint-003 的 support/public truth 仍保持 `fail-closed`，等待下一轮 fresh reviewer 与 project-final CR clean 后再进入 `TK-1042` closeout。
