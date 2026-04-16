# Code Review: sprint-003 execution and governed CR orchestration round 1

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: scoped sprint review
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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-delivery-orchestration-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/delivery-workflow-summary-and-artifact-backlink-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/session-shell-delivery-workflow-presenter-contract.md`

## 1. Review Scope

1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/constants/cli-session-shell-delivery-workflow.constant.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
4. `apps/cli/src/types/interfaces/cli-session-shell.interface.ts`
5. `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
6. `packages/core-orchestration-service/src/constants/session-delivery-workflow.constant.ts`
7. `packages/core-orchestration-service/src/index.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
9. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-003-execution-and-governed-cr-orchestration/tasks/TK-929-route-task-driven-execution-and-governed-cr-through-deliver-orchestration.md`

## 2. Findings

### 2.1 [P1] Keep deliver backlinks on presenter-safe canonical artifacts

- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts:648`
- 问题描述: `deliveryWorkflowUpdate.relatedArtifactPaths` 当前把 `review_request`、`review_verify_result` 与 `review_ledger_backfill` 这类 transport/receipt artifact 一起投影进 deliver overlay。它们不是 presenter-safe canonical review truth，会让 shell/desktop backlink 到 queue/backfill JSON，而不是 authoritative review artifact / CR task surface。
- 影响: 违反 `delivery-workflow-summary-and-artifact-backlink-contract.md` 对 presenter-safe backlink 的边界约束，也与 `TK-929` 中“deliver 只回链 canonical review truth”的任务结论冲突。
- 建议: `relatedArtifactPaths` 与 presenter-facing child workflow backlink 只保留 execution report、canonical review markdown、CR task card 等 canonical/presenter-safe artifact；request/verify/backfill receipt 若仍需保留，应停留在非 presenter 诊断层。

### 2.2 [P2] Localize new delivery backlink summaries

- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts:656`
- 问题描述: 新增的 child workflow backlink summary 使用了硬编码英文，例如 `Task-driven run execution report.` 与 `Review verify decision=...`。这些 summary 属于 `apps/**` presenter metadata，会被 session shell / desktop surface 消费。
- 影响: 违反 `CS-033` 的 i18n 基线，非英文 locale 会直接拿到未本地化文案。
- 建议: 改为使用已本地化的 command summary，或只存结构化状态字段并让消费端在展示时本地化，不要把硬编码英文写入 deliver metadata。

### 2.3 [P2] Cover the remaining delivery status-routing matrix

- 位置: `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts:298`
- 问题描述: 新增测试只覆盖了 `governance_run=VERIFIED`、`review_queue=REVIEW_PENDING` 与 `review_verify=RESOLVED`，尚未覆盖 `governance_run` fallback / `REVIEW_PENDING` / `RESOLVED`、`review_queue=RESOLVED` 与 `review_verify=VERIFIED` 等新分支。
- 影响: deliver overlay 的 `currentPhase` / `pendingAction` 路由存在无保护分支，回归时可能静默把工作流导向错误的 pending action。
- 建议: 补齐剩余状态分支的 table-driven 或等价断言，让 sprint-003 新增路由矩阵形成完整的 focused coverage。

## 3. Notes

1. delegated reviewer round 1 确认 `selectedTargetStream` 的 merge/persistence 逻辑没有发现新的可操作问题。
2. orchestration-owned pending-action vocabulary 已集中到 `packages/core-orchestration-service`，这一方向本身是正确的。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`（通过）
3. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
4. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-003-execution-and-governed-cr-orchestration/tasks --task-id TK-929`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：deliver summary/backlink contract 明确要求 `related_artifact_paths[]` 只保留 presenter-safe backlink；当前实现把 `review_request`、`review_verify_result` 与 `review_ledger_backfill` 这类 receipt artifact 直接暴露进 deliver overlay。
   - 处理：accepted；修复为仅保留 execution report、canonical review markdown 与 CR task card 等 canonical/presenter-safe artifact。
2. `2.2`
   - 判定：**认可**
   - 证据：新增 child workflow backlink summary 位于 `apps/**` presenter metadata，受 `CS-033` 约束；硬编码英文会直接泄漏到非英文 locale。
   - 处理：accepted；修复为复用已本地化的 command summary，不再把新的硬编码英文写入 delivery metadata。
3. `2.3`
   - 判定：**认可**
   - 证据：原测试只覆盖新增状态矩阵中的部分分支，`currentPhase`/`pendingAction` 仍有未断言路径。
   - 处理：accepted；补齐 `governance_run` 剩余分支、`review_queue=RESOLVED` 与 `review_verify=VERIFIED` 的 focused coverage。

### 验证命令

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`、`apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
   - 说明：deliver overlay 现在只回链 execution report、canonical review markdown 与 CR task card 等 presenter-safe artifact，不再把 request/verify/backfill receipt 暴露进 `relatedArtifactPaths` 或 presenter-facing review backlink。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`、`apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
   - 说明：新 child workflow backlink summary 已改为复用 command summary，不再写入新的硬编码英文 presenter 文案。
3. `2.3`：已完成
   - 变更文件：`apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
   - 说明：已补齐 `governance_run` 剩余分支、`review_queue=RESOLVED` 与 `review_verify=VERIFIED` 的 focused status-routing coverage。

## 处置结果与剩余风险

1. 当前 round 1 的 accepted findings 已全部修复并通过同窗口复验。
2. 剩余风险：仍需 fresh reviewer clean recheck round 确认没有新的 actionable finding 才能让 sprint-003 进入 closeout。
