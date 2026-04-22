# Code Review: sprint-002 workflow draft-session authoring baseline

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint review
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
3. `apps/vscode-extension`
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline`

## 2. Findings
### 2.1 [P1] Read-only preview sessions can still mutate and commit canonical workflow
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:184`
- 问题描述: `read_only` preview session 目前只在 VS Code presenter 层被禁用，服务端 `applyDraftMutation()` 与 `commitWorkflowDraft()` 没有入口模式保护，因此绕过 UI 仍可直接修改并提交 preview draft。
- 影响: 破坏 local orchestration service 作为唯一 truth owner 的约束，可能把 preview flow 错误写回 `active-workflow.definition.json` 与 compiled IR。
- 建议: 在 service layer 对 `read_only` session fail-closed，并让 `supportedPatchOps` 只暴露真实允许的能力。

### 2.2 [P2] VS Code 没有按服务端 `supportedPatchOps` 消费 authoring contract
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:1060`
- 问题描述: 服务端已暴露 `supportedPatchOps`，但 VS Code surface 仍硬编码 action 列表与 switch 分支，未对齐 `UPDATE_NODE_POLICY` 等 service-owned capability。
- 影响: extension 重新推导 authoring capability，形成 service/client/VS Code contract drift。
- 建议: 让 Workflow Studio action 与 controller branch 由 `supportedPatchOps` 驱动，并补齐 `UPDATE_NODE_POLICY` 的直接处理路径。

### 2.3 [P2] 冲突与只读 authoring 分支缺少针对性回归覆盖
- 位置: `packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts:501`
- 问题描述: 当前新增测试主要覆盖 happy path，未覆盖 `STALE_DRAFT_REVISION`、`BASE_DEFINITION_CHANGED`、只读 mutation/commit rejection，以及 `supportedPatchOps` 对齐分支。
- 影响: 本轮 draft-session seam 的核心安全路径缺少护栏，容易再次漏掉 read-only / conflict 类回归。
- 建议: 为 service sidecar 与 VS Code authoring surface 增加上述分支的 targeted regression tests。

## 3. Notes
1. delegated reviewer findings 已由主 agent 复核；本轮 3 条 finding 全部判定为 `accepted`，并进入修复回路。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:desktop-entry-smoke`（通过）
6. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts` 的 `applyDraftMutation()` 与 `commitWorkflowDraft()` 在修复前都未校验 `entryMode=read_only`。
   - 处理：在 service layer 对 preview draft 直接 fail-closed，并让 `supportedPatchOps` 只暴露真实允许的操作。
2. `2.2`
   - 判定：**认可**
   - 证据：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts` 与 `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts` 在修复前都以本地硬编码列表驱动 authoring action。
   - 处理：让 Workflow Studio 与 controller 都按 service-owned `supportedPatchOps` 消费能力，并补上 `UPDATE_NODE_POLICY` 分支。
3. `2.3`
   - 判定：**认可**
   - 证据：修复前仅覆盖 happy path，缺少 `read_only` reject、`STALE_DRAFT_REVISION`、`BASE_DEFINITION_CHANGED` 和 patch-op 对齐断言。
   - 处理：为 sidecar authoring seam 与 VS Code workflow surface 补齐 targeted regression tests。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：服务层新增 `read_only` fail-closed 保护，并让 preview session 只暴露 `VALIDATE` 这一项 patch-op 能力。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：Workflow Studio 改为按 service-owned `supportedPatchOps` 渲染 action，并补上 `UPDATE_NODE_POLICY` 直接处理路径。
3. `2.3`：已完成
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：补齐 `read_only` reject、`STALE_DRAFT_REVISION`、`BASE_DEFINITION_CHANGED` 与 patch-op 对齐分支的 targeted regression coverage。

## 风险与后续（2026-04-22）

1. `CR-001` 已完成 accepted finding 修复与同窗验证；下一步需要按 scoped CR 规则启动 fresh reviewer recheck，而不是复用本轮 reviewer 结论。
