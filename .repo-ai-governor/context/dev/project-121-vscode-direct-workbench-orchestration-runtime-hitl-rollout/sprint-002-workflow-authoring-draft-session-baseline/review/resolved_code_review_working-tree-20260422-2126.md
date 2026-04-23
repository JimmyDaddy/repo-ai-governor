# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 5

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-005`
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
### 2.1 [P2] Draft-session lookup failures are masked as “no draft available”
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:1414`, `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:3212`
- 问题描述: `queryWorkflowDraftSession()` 会把所有 sidecar/runtime 异常都吃掉并返回 `undefined`，而 `requireWorkflowDraftSession()` 再把这个结果统一改写成“先启动 preview/create/edit”。对于 mutate/validate/commit 这种 state-changing flow，这会把真实的 transport/backend fault 伪装成“没有 draft”。
- 影响: 用户可能沿着错误恢复路径重新开启一个新的 draft session，而当前运行时真正的故障被隐藏；在 single active draft-session 文件模型下，这会放大误操作风险。
- 建议: 保留 webview snapshot refresh 的 soft-fail 查询，但给 mutate/validate/commit 单独走 strict lookup，让后端错误原样冒泡。

### 2.2 [P2] Unsupported workflow template ids silently downgrade to the default seed
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:138`, `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:1113`
- 问题描述: 旧实现会把任何未知 `templateId` 归一化成默认模板 `parallel-review`，而 chat success copy / free-text prompt 又把原始请求值当作已接受模板来呈现。
- 影响: 用户以为自己打开的是模板 `X`，实际服务却 seed 了默认图；这会破坏 authoring correctness，也让审计/回放难以解释。
- 建议: 对未知模板 ID fail-closed，或者至少把服务端最终解析到的模板 ID 显式回传并统一用于所有 caller/message。

## 3. Notes
1. fresh delegated reviewer round surfaced 2 residual `P2` findings after `CR-004` resolved；主 agent 已接受这两项并进入修复/验证回路。
2. accepted findings 已完成修复并进入同窗 lifecycle closeout；下一步必须继续发起 fresh `CR-006` reviewer round，而不是直接进入 sprint-002 closeout。

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
   - 证据：`queryWorkflowDraftSession()` 的 soft-fail 分支适合 workflow-studio snapshot refresh，但 controller 的 mutate/validate/commit 之前也复用了这条路径，导致 sidecar/backend fault 会被统一改写成 `WORKSPACE_SOURCE_NOT_FOUND`。
   - 处理：保留 snapshot refresh 的 soft query，同时新增 `queryWorkflowDraftSessionStrict()` 供 state-changing flow 使用；controller 现在对 validate/mutate/commit 走 strict lookup，并补 service-runtime/controller 回归覆盖。
2. `2.2`
   - 判定：**认可**
   - 证据：`startWorkflowDraft()` 之前会先把请求里的模板 ID 归一化到默认模板，再 seed draft definition；unknown template id 因此会被静默降级到 `parallel-review`。
   - 处理：新增 `resolveRequestedTemplateId()` 对未知模板 ID fail-closed，并补 sidecar integration 与 VS Code chat regression coverage，保证用户请求的模板 ID 不再被静默改写。

### 验证命令
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

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：workflow-studio snapshot 仍保留 soft-fail draft query，但 mutate/validate/commit 已切到 strict lookup，后端故障会原样抛出，不再被错误包装成“没有 draft”。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：未知模板 ID 现在 fail-closed，不再静默降级到默认模板；内置 sidecar 集成测试也切到了真实支持的 built-in 模板集合。

## 风险与后续（2026-04-22）

1. `CR-005` 的 accepted findings 已完成修复并补齐 build/package/smoke 证据；按 scoped CR 规则，下一步仍需 fresh `CR-006` reviewer round，不能把本轮 resolved 直接当成 sprint-002 clean closeout。
