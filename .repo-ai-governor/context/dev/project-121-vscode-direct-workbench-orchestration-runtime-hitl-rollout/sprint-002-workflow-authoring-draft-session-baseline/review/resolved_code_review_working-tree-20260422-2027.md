# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 3

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-003`
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
### 2.1 [P2] Edit flow does not fail closed when no saved workflow definition exists
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:132`
- 问题描述: `EDIT_SEED` 入口在缺失 canonical workflow definition 时，会静默回退到 template seed；与此同时 VS Code 仍把这个入口标成 “Edit saved workflow”，导致“编辑已保存真值”和“从模板重新建稿”被混成一条路径。
- 影响: 用户可能误以为自己在编辑既有 canonical workflow，实际却是在空仓状态下创建一份新模板草稿并最终提交为规范定义。
- 建议: 对 `EDIT_SEED` 缺失保存定义的分支 fail-closed，并补回归覆盖，确保该入口不会再静默 seed template。

### 2.2 [P2] Stale revision conflicts become sticky persisted session state
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:544`
- 问题描述: `STALE_DRAFT_REVISION` 目前通过 `persistConflictResponse()` 回写到持久化 draft session；rehydration 又会保留这类 conflict，而 Workflow Studio 对任何 `conflictState.hasConflict` 都会禁用 authoring/validate action。
- 影响: 一次过期 revision 请求会把“请求级 stale warning”放大成“持久化 session 卡死”，后续 fresh client 即使已经拿到最新 revision，也可能重新连上一个被锁住的 UI。
- 建议: stale revision 只做瞬态响应，不写成 durable conflict state；rehydration 也应自动清掉旧的 stale conflict，并补 recovery coverage。

## 3. Notes
1. fresh delegated reviewer round surfaced 2 residual `P2` findings after `CR-002` resolved；主 agent 已接受这两项并进入修复回路。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:desktop-entry-smoke`（通过）
6. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`startWorkflowDraft()` 在 `EDIT_SEED` 分支下此前会在缺失保存定义时继续走 `createDraftDefinition(...)`；与此同时 VS Code `runWorkflowEdit()` 和 chat edit 流程都把这条路径呈现为 “Edit saved workflow”。
   - 处理：将 `EDIT_SEED` 收口为真正的 saved-workflow-only 入口；没有 canonical workflow definition 时直接 fail-closed，并补控制器/sidecar 回归覆盖。
2. `2.2`
   - 判定：**认可**
   - 证据：`createDraftRevisionConflictResponse()` 之前会把 `STALE_DRAFT_REVISION` 通过 `persistConflictResponse()` 落盘，而 `readPersistedDraftSession()` 又会把这种冲突原样 rehydrate 到 service-owned session。
   - 处理：把 stale revision 降级为瞬态 warning，返回最新干净 session；rehydration 只保留 durable `BASE_DEFINITION_CHANGED` conflict，并补 recovery coverage。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：`EDIT_SEED` 现只允许打开已保存 workflow definition；缺失 canonical workflow 时直接 fail-closed，不再静默回退到 template seed，VS Code edit 流程也不再提示模板输入。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：`STALE_DRAFT_REVISION` 改为瞬态响应，不再持久化为 draft-session durable conflict；rehydration 只保留 `BASE_DEFINITION_CHANGED`，避免 stale warning 把 Workflow Studio 锁死。

## 风险与后续（2026-04-22）

1. `CR-003` 的 accepted findings 已完成修复与同窗验证；按 scoped CR 规则，下一步必须继续发起 fresh `CR-004` reviewer recheck，不能把本轮 resolved 直接当成 sprint-002 clean closeout。
