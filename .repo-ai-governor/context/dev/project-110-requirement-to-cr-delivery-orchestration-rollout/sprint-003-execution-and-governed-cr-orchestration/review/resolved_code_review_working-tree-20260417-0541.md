# Code Review: sprint-003 execution and governed CR orchestration round 2

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: scoped sprint recheck review
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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/delivery-workflow-summary-and-artifact-backlink-contract.md`

## 1. Review Scope

1. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`

## 2. Findings

### 2.1 [P2] Align selected-stream persistence coverage with presenter-safe deliver backlinks

- 位置: `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts:1593`
- 问题描述: sprint-003 第 2 轮 clean recheck 发现，selected-target-stream persistence test 仍然把 `review-verify-result.json` 作为 `relatedArtifactPaths` 与 `REVIEW_VERIFY` backlink 的合法 payload。该 receipt 已不再属于 deliver overlay 允许暴露的 presenter-safe canonical artifact 集合。
- 影响: 测试仍在守护修复前的 receipt 形态，无法真正防止 deliver overlay 重新泄漏 review transport/backfill artifact。
- 建议: 把 follow-up `deliveryWorkflowUpdate` 与期望 merged state 改成 canonical review markdown 与 CR task card 等 presenter-safe artifact 形态，保持测试与当前 contract 一致。

## 3. Notes

1. session-shell runtime 的 repaired mapping 与新增路由覆盖在本轮 reviewer 中未发现新的 actionable issue。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`（通过）
3. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：core persistence test 仍把 `review-verify-result.json` receipt 作为 deliver overlay 的 presenter-safe backlink；这与当前 repaired CLI mapping 和 delivery summary contract 已不一致。
   - 处理：accepted；将 follow-up `deliveryWorkflowUpdate` 与期望 merged state 改为 canonical review markdown + CR task card 形态，并让 `REVIEW_VERIFY` backlink 回到 canonical review artifact。

### 验证命令

1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`（通过）
3. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
   - 说明：selected-stream persistence test 现在只保留 canonical review markdown 与 CR task card 这类 presenter-safe artifact，去掉了旧的 `review-verify-result.json` receipt 形态。

## 处置结果与剩余风险

1. 当前 round 2 的 accepted finding 已修复并通过同窗口复验。
2. 剩余风险：仍需下一轮 fresh reviewer clean round 确认 sprint-003 当前边界已无 actionable finding。
