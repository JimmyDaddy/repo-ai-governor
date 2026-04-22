# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 12

- Status: resolved
- Date: 2026-04-23
- Reviewer: AI-Agent
- Task: `CR-012`
- Review Type: delegated sprint recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/orchestration-service-client`
2. `packages/core-orchestration-service`
3. `apps/vscode-extension/src/runtime`
4. `apps/vscode-extension/src/types`
5. `apps/vscode-extension/test`
6. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline`

## 2. Findings
### 2.1 [P1] Removing the current entry node silently rewrites the workflow start
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:241`
- 问题描述: remove-node 路径在删除当前 `entryNodeId` 时会直接把入口改成 `remainingNodes[0]` 并返回成功；VS Code remove-node flow 又没有要求用户显式选择 replacement entry。
- 影响: 用户的一次正常删除操作就可能把 canonical workflow 的起点静默改成图中另一个节点，而且 commit/validation 仍会通过，属于 service-owned control-flow truth 被隐式改写。
- 建议: 在未显式选择 replacement entry 之前 fail-close，阻断删除当前入口节点，并补回归测试覆盖 `remove current entry -> commit` 路径。

### 2.2 [P2] No-op edit commit rewrites canonical execution identity
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:178`
- 问题描述: `EDIT_SEED` 使用 fresh `workflowDraftId` 去重新 normalize 已保存 definition 的 `executionId`；因此打开一个已保存 workflow 后不做任何修改直接 commit，仍会改写 canonical definition，并生成新的 active compiled-ir snapshot。
- 影响: noop edit 不再幂等，会制造无意义的 canonical artifact churn 和 trace/snapshot identifier 漂移。
- 建议: 在 `EDIT_SEED` 与 draft rehydration 路径中保留 saved workflow 的 canonical `executionId`，并补 no-op edit idempotence regression test。

## 3. Notes
1. fresh delegated reviewer round surfaced `1 x P1 + 1 x P2` finding；主 agent 已完成逐条复核，并确认两条都是 service-owned workflow truth 的 correctness 风险。
2. 两条 finding 都属于 risk-based inference，但分别命中“silent control-flow rewrite”和“noop edit mutates canonical identity”这两个不应放行的 runtime 行为面，因此按 actionable findings 处理。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:desktop-entry-smoke`（通过）
6. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-23）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 remove-node mutation 在删除 active entry node 时确实会 silent fallback 到 `remainingNodes[0]`，而 first-party VS Code flow 没有 replacement-entry contract；reviewer 的“隐式改写 workflow start”判断成立。
   - 处理：accepted，删除当前入口节点前直接 fail-close，要求先通过显式 entry reassignment 完成起点切换，并补回归测试。
2. `2.2`
   - 判定：**认可**
   - 证据：`EDIT_SEED` 与 draft rehydration 都会把 definition.executionId 重新绑到 draft session identity；因此 no-op edit commit 仍会写出新的 compiled-ir snapshot。reviewer 对 canonical identity churn 的判断成立。
   - 处理：accepted，保留 saved workflow 的 canonical `executionId`，并补 no-op edit idempotence regression test。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-23）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：current entry node 现在不能被直接删除；只有显式切换入口后才能移除原入口节点，避免 workflow start 被 silent rewrite。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：`EDIT_SEED` 与 draft rehydration 已保留 canonical `executionId`，noop edit commit 不会再改写 definition identity 或生成额外 compiled-ir snapshot。

## 风险与后续（2026-04-23）

1. `CR-012` 的 accepted findings 已修复并完成同窗 build/package/smoke/targeted/gov verification。
2. sprint-002 仍需 fresh `CR-013` reviewer round；只有最新 round 明确返回“无 actionable findings”，`TK-1040` 才能进入 closeout。
