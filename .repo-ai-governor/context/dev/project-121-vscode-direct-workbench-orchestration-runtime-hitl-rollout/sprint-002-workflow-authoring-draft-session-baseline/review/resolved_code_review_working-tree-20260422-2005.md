# Code Review: sprint-002 workflow draft-session authoring baseline post-fix recheck

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-002`
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
1. `packages/core-orchestration-service`
2. `apps/vscode-extension`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline`

## 2. Findings
### 2.1 [P2] Validate path can clear base-definition conflicts instead of staying fail-closed
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:328`
- 问题描述: `validateWorkflowDraft()` 通过 `applyDraftMutation(...requiresMutableDraftSession=false)` 复用重校验路径；如果该路径没有和 commit/mutate 共用 base-definition conflict 检查，`BASE_DEFINITION_CHANGED` 会话会被重新落成“已重新校验”的 clean state。
- 影响: VS Code authoring surface 可能在底座定义已变化后继续基于过期草稿做判断，破坏 conflict-safe draft-session contract。
- 建议: validate、mutate 与 commit 共用同一个 base-definition conflict fail-closed gate，并在冲突存在时保留 `BASE_DEFINITION_CHANGED` 状态。

### 2.2 [P2] Persisted draft-session rehydration does not recompute normalized supportedPatchOps
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:884`
- 问题描述: 持久化 draft session 重新加载时，如果直接信任落盘的 `supportedPatchOps`，read-only / preview 会话在 sidecar 重启或持久化文件漂移后仍可能暴露 mutation/commit capability。
- 影响: service-owned authoring capability 会和 canonical `entryMode` 语义漂移，VS Code 重新连上后可能看到被污染的 action contract。
- 建议: 以 persisted definition + session metadata 重建 normalized draft session，仅在需要时回灌既有 `conflictState`，而不是复用历史 capability 快照。

## 3. Notes
1. fresh delegated reviewer round surfaced 2 residual `P2` findings after `CR-001` fixes; 主 agent 将继续逐条复核并决定是否接受。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:desktop-entry-smoke`（通过）
6. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`validateWorkflowDraft()` 在 `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts` 中复用 draft mutation runtime；如果不和 mutate/commit 共用 `createBaseDefinitionConflictResponse()`，就会在 base definition 已变更时错误清空 conflict state。
   - 处理：修复后 validate 与 commit 都保留 `BASE_DEFINITION_CHANGED` fail-closed 行为，冲突会继续留在 service-owned draft session 上。
2. `2.2`
   - 判定：**认可**
   - 证据：`readPersistedDraftSession()` 负责 sidecar 重连后的 session rehydration；能力集合必须从 `entryMode + definition` 重新归一化，而不能直接相信落盘快照中的 `supportedPatchOps`。
   - 处理：修复后 rehydration 通过 `buildDraftSession()` 重建 normalized session，只在存在冲突时回灌原有 `conflictState`。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：`applyDraftMutation()`、`validateWorkflowDraft()` 与 `commitWorkflowDraft()` 现统一复用 base-definition conflict fail-closed gate，`BASE_DEFINITION_CHANGED` 不会再被 validate 清空。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：rehydration 改为通过 normalized definition + session metadata 重建 service-owned session，并让冲突态下的 `Validate draft` action 保持禁用，避免 UI 暗示 capability 仍然可用。

## 风险与后续（2026-04-22）

1. `CR-002` 的 accepted findings 已完成修复与同窗验证；下一步必须继续按 scoped CR 规则发起 fresh `CR-003` reviewer recheck，不能复用本轮 reviewer 结论替代。
