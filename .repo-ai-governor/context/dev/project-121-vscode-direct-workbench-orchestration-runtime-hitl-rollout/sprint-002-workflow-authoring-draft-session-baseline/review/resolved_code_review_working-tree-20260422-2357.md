# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 11

- Status: resolved
- Date: 2026-04-23
- Reviewer: AI-Agent
- Task: `CR-011`
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
### 2.1 [P1] Deleting the final workflow node can corrupt the active draft session
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:241`
- 问题描述: reviewer 复现了 remove-node 路径在删除最后一个节点时把 `entryNodeId` 写成空字符串，然后继续持久化 draft session；同一个 service 的 rehydration 路径随后会把这份 payload 视为 `payload_shape_invalid` 并抛出 `DURABLE_STORAGE_VERIFY_FAILED`。
- 影响: VS Code 的一条正常 authoring 操作就可能把当前 draft 写成 service 自己都无法重新加载的坏状态，后续 query/refresh/mutation 会全部失效，直到人工清理持久化文件。
- 建议: 在删到最后一个节点前 fail-close，禁止写入结构上不可重载的草稿，并补覆盖“删除最后节点后仍可重新查询”的回归测试。

## 3. Notes
1. fresh delegated reviewer round surfaced `1 x P1` finding；主 agent 已完成复核，并确认这是 service-owned truth consistency 问题，不是单纯 UX 提示缺口。
2. 该 finding 主要是 risk-based inference，但与 “`local_orchestration_service` 是唯一 truth owner” 的 sprint 边界直接冲突，因此按 release-blocking correctness 处理。

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
   - 证据：`updateWorkflowDraftNode(remove=true)` 会在删除 entry node 且无剩余节点时把 `entryNodeId` 写成空字符串；`readPersistedDraftSession()` 又要求 persisted definition 的 `entryNodeId` 必须是非空字符串，因此 reviewer 给出的“service 自己写坏并拒绝重载”的复现成立。
   - 处理：accepted，删除最后一个节点前直接 fail-close，避免把不可重载的 draft payload 写盘，并补覆盖该路径的回归测试。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-23）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：draft runtime 现在会拒绝删除当前最后一个节点，因此 persisted draft session 仍保持可重载；新增回归测试验证 failed mutation 不会损坏后续 query。

## 风险与后续（2026-04-23）

1. `CR-011` 的 accepted finding 已修复并完成同窗 build/package/smoke/targeted/gov verification。
2. sprint-002 仍需 fresh `CR-012` reviewer round；只有最新 round 明确返回“无 actionable findings”，`TK-1040` 才能进入 closeout。
