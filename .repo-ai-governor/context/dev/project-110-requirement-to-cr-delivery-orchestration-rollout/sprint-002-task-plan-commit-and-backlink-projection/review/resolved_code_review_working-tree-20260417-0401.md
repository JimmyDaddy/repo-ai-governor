# Code Review: sprint-002 task plan commit and backlink projection round 2

- Status: resolved
- Date: 2026-04-17
- Reviewer: Rawls delegated reviewer, verified by AI-Agent
- Task: `CR-002`
- Review Type: delegated sprint recheck
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
1. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
2. `apps/cli/test/runtime/session-shell-runner.test.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-delivery-workflow-runtime.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
6. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-002-task-plan-commit-and-backlink-projection/tasks/CR-002.md`

## 2. Findings
### 2.1 [P1] follow-up confirm preview could not survive exit and reattach
- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
- 问题描述: `/plan sync` 在 direct bridge 成功后只把 follow-up `plan commit ... --confirm-plan approve` 保存在本地 `runtimeState.pendingCommand`。一旦 shell 退出或重新附着，会话事件流里没有任何结构化 pending preview 事实，`/confirm` 无法恢复该 handoff。
- 影响: sprint-002 要求的 preview -> commit governed bridge 在 resume 场景下失效，用户会看到 pending action，但丢失真正可确认的 command truth。
- 判定: **认可**

### 2.2 [P1] appended plan preview metadata did not bootstrap canonical delivery state for brand-new sessions
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-delivery-workflow-runtime.ts`
- 问题描述: `resolveMessageMetadataUpdate()` 只会在 session context 里已经存在 delivery overlay 时合并 `deliveryWorkflowUpdate`。brand-new shell session 若先走 `/plan sync`，append message 只能得到 presenter metadata，canonical `deliveryWorkflowState` 会被直接丢弃。
- 影响: orchestration-owned delivery truth 与 presenter recap 产生分叉，brand-new session 无法把 task-plan preview properly 写回 governed shared-session state。
- 判定: **认可**

## 3. Notes
1. 本轮 fresh reviewer `Rawls` 返回 2 个 actionable finding；主 agent 复核后均判定为接受并在同窗口修复。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/react-cli-runner.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，5 files / 131 tests）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：follow-up preview 现在会把 `sessionMainPendingCommandPreview` 元数据写入 `SESSION_MESSAGE_APPENDED` 事件；reattach 后 shell 会从 canonical event stream 恢复 pending preview，并允许 `/confirm` 继续执行 `plan commit`.
   - 处理：在 `armPendingCommandPreview()` 中持久化结构化 preview metadata，并扩展 `resolvePendingCommandFromEvent()` 兼容从 appended-message metadata 重建 pending handoff。
2. `2.2`
   - 判定：**认可**
   - 证据：brand-new session 现在即便没有先前 `sendSessionTurn()`，只要 append message 携带 `deliveryWorkflowUpdate`，也会 bootstrap 一份合法的 delivery workflow baseline，再合并新的 phase/pending action/backlinks。
   - 处理：为 `resolveMessageMetadataUpdate()` 增加 absent-state bootstrap 路径，并在 `appendSessionMessage()` 调用时透传 `sessionId` 作为 bootstrap seed。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/react-cli-runner.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，5 files / 131 tests）
4. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 风险与后续
1. round-2 accepted finding 已完成修复，但 sprint-002 是否已经 clean 仍需下一轮 fresh reviewer recheck 再确认。

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/react-cli-runner.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：pending follow-up preview 现在持久化为 service-owned session event metadata，exit/reattach 后 `/confirm` 仍可恢复同一个 `plan commit` handoff。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-delivery-workflow-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/react-cli-runner.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：brand-new shell session 的 appended delivery metadata 现在会 bootstrap canonical delivery state，而不是只停留在 presenter recap。

## 处置结果与剩余风险
1. `CR-002` 的 2 个 accepted finding 已全部修复并完成同窗口 build + targeted tests + governance gates。
2. sprint-002 下一步进入 fresh reviewer clean recheck；只有 clean round 无 actionable finding，才允许 closeout。
