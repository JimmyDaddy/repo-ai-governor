# Code Review: working-tree-20260422-1500

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-012`
- Review Type: sprint delegated recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`
2. `packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`
6. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-012.md`

## 2. Findings
### 2.1 [P1] Non-working-tree `CR-*` lifecycle docs were still eligible for sprint fallback
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts:258`
- 问题描述: 第 12 轮 reviewer 指出，`isSprintWorkingTreeReviewCandidate()` 仍然把 `Task: CR-xxx` 这种普通 review lifecycle 元数据当成 working-tree fallback 信号，因此同 sprint 下的 `resolved_code_review_support-truth.md` 之类非 working-tree 文档仍可能被 execution review routing 选中。
- 影响: execution board/handoff、runtime lanes、HITL decision packet 和 queue ownership 仍可能把普通 CR artifact 误投影成 execution 的 canonical review truth，继续违反 direct-workbench backlink contract。
- 建议: sprint fallback 必须要求 review 文件名或标题带有真实 `working-tree` 标记，`CR-*` 最多只能作为同类文档的辅助信息，不能单独提升为 working-tree candidate；同时补三层回归，覆盖 review-routing / governance-query / shell 的 non-working-tree `CR-*` 场景。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，是上一轮 ownership 修复后剩余的 classifier 尾洞。
2. 修复后 same-sprint fallback 的语义被进一步收敛为“真实 working-tree review + ownership 唯一可证”双重条件；普通 `CR-*` lifecycle doc 仍可出现在 review queue，但不会再被 execution backlink 误绑定。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run check:ide-entry-smoke`（通过）
6. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：reviewer 的 reproduction 成立。上一轮把 `CR-*` 当作 working-tree fallback 的辅助条件后，普通 same-sprint lifecycle doc 仍然会被 `isSprintWorkingTreeReviewCandidate()` 纳入候选集。
   - 处理：classifier 现在只接受文件名或标题里带有真实 `working-tree` 标记的 review 文档；新增 review-routing、governance-query 与 shell 三层 regression，证明 non-working-tree `CR-*` 文档不会再被 execution review fallback 绑定。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：same-sprint fallback 现在必须同时满足“真实 working-tree 文档”与“ownership 唯一可证”，普通 `CR-*` lifecycle doc 不会再误入 execution review routing。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
