# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 6

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-006`
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
### 2.1 [P2] Corrupted persisted workflow artifacts are downgraded to missing state
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:925`, `packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts:1011`, `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:1414`
- 问题描述: 原实现把 draft-session / saved definition 的读取与解析失败统一吞掉成 `undefined/null`，上层随后会把它解释成“没有 draft”或“没有 saved definition”。对于当前单槽持久化模型，这会把仍可诊断和恢复的损坏态误降级成缺失态。
- 影响: 用户可能在坏状态上重新发起 edit/create/refresh，覆盖唯一持久化槽位并丢失恢复线索；同时 VS Code 工作台会把真实损坏误呈现成“重新开始草稿”的普通引导。
- 建议: 对 `ENOENT` 保持缺失语义，但对 parse/schema/shape/unsupported-template 这类损坏态统一 fail-closed 为 durable storage verification failure，并让 workflow-studio 的 soft query 也显式暴露该类错误。

## 3. Notes
1. fresh delegated reviewer round surfaced 1 residual `P2` finding after `CR-005` resolved；主 agent 已接受该项并进入修复/验证回路。
2. `CR-006` 收口后仍需继续发起 fresh `CR-007` reviewer round，才能判断 sprint-002 是否真正 clean。

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
   - 证据：`readPersistedDraftSession()` / `tryLoadPersistedDefinition()` 之前通过 `safeReadJson()` 把 parse/read/schema/shape 问题全部压成“文件不存在”；VS Code soft query 也会继续把这类异常吞掉并返回 `undefined`。
   - 处理：将持久化读取改成 fail-closed artifact reader，区分 `ENOENT` 与 `DURABLE_STORAGE_VERIFY_FAILED`；draft-session / workflow-definition 会对 schema、payload shape 与 unsupported template id 做明确损坏判定；VS Code 的 soft query 继续容忍一般后端刷新失败，但不再吞掉 durable storage corruption。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workflow-draft-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`pnpm run check:desktop-entry-smoke`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：持久化 workflow draft artifacts 现在会把“缺失”和“损坏”严格区分；损坏态统一抛出 `DURABLE_STORAGE_VERIFY_FAILED`，并通过 sidecar/VS Code 流转到工作台而不是被误判成“没有 draft”。

## 风险与后续（2026-04-22）

1. `CR-006` 的 accepted finding 已完成修复并补齐 build/package/smoke/gov 证据；按 scoped CR 规则，下一步必须发起 fresh `CR-007` reviewer round，而不是直接进入 sprint-002 closeout。
