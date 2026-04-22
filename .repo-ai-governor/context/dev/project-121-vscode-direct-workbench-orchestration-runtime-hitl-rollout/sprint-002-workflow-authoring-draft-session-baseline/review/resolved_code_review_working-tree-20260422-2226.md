# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 7

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-007`
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
### 2.1 [P2] Workflow draft commit can leave canonical artifacts half-updated
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:439`, `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:1361`
- 问题描述: 原 commit 路径在持久化 canonical definition、compiled IR 和 refreshed draft-session 时没有整体回滚语义。只要后段写入失败，调用方就会收到 failed commit，但 definition truth 可能已经落盘，造成 service-owned artifacts 彼此错位。
- 影响: 下一次 edit/commit 可能在假阳性的 `BASE_DEFINITION_CHANGED` 或不一致 backlink state 下启动；更糟的是，唯一 canonical workflow truth 会被置于“用户看到失败、磁盘却已经部分提交”的高风险状态。
- 建议: 让 commit path 先 capture 旧 artifact，再统一执行 compiled IR / definition / draft-session 写入；任一步失败都回滚到前一稳定状态，并补 failure-injection regression coverage。

## 3. Notes
1. fresh delegated reviewer round surfaced 1 residual `P2` finding after `CR-006` resolved；主 agent 已接受该项并进入修复/验证回路。
2. `CR-007` 收口后仍需继续发起 fresh `CR-008` reviewer round，才能判断 sprint-002 是否真正 clean。

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

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：旧 commit 流程没有在 `persistCompiledIrSnapshot()`、definition write 和 `writePersistedDraftSession()` 之间建立 rollback；reviewer 指出的 partial-write 风险成立，而且 happy-path 测试无法覆盖。
   - 处理：新增 committed-artifact backup/restore 流程，让 compiled IR、workflow definition 和 draft-session 写入进入同一个 rollback boundary；同时增加 failure-injection 单测，验证 draft-session write 失败时 definition/compiled-ir 不会残留半提交状态。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：workflow draft commit 现在在 durable boundary 内先备份、后写入、失败即回滚；调用方不会再遇到“返回失败但 canonical definition 已经更新”的半提交状态。

## 风险与后续（2026-04-22）

1. `CR-007` 的 accepted finding 已完成修复并补齐 build/package/smoke/gov 证据；按 scoped CR 规则，下一步必须发起 fresh `CR-008` reviewer round，而不是直接进入 sprint-002 closeout。
