# Code Review: working-tree-20260422-1430

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-011`
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
2. `packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-governance-affordance-builder.ts`
6. `packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts`
7. `packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
9. `packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`
10. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-011.md`

## 2. Findings
### 2.1 [P1] Same-sprint working-tree fallback could cross-wire review ownership across executions
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts:132`
- 问题描述: 第 11 轮 reviewer 指出，live sprint `working-tree` review fallback 只看 “当前 sprint 最新 CR”，却没有证明它唯一属于当前 execution。这样在同一个 sprint 下出现多个 execution 时，runtime lanes、HITL decision packet、automation/review queue 和 review handoff target 可能把别的 execution 的 review artifact 错绑过来。
- 影响: direct-workbench 的 `review_backlinks / reviewId / review_document handoff` 不再是 service-owned canonical truth，会破坏 `direct-workbench orchestration runtime / VS Code workbench surface` 合同要求的唯一回链约束。
- 建议: 对 `working-tree` fallback 仅在同一 `project/sprint` 下不存在 competing execution 时才允许返回；否则保持 fail-closed，并让 artifact-pane / governance query / queue overview / handoff builder 共用同一条唯一性规则。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，核心是 review ownership 唯一性，而不是 review 文档“能不能找到”。
2. 修复同时补上 sidecar IPC 对 `queryRoleLaneStatus / querySessionContinuity` 的 focused round-trip coverage，避免下轮 reviewer 因 seam 覆盖空洞再次阻断 sprint closeout。

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
   - 证据：reviewer 指出的 ownership 漏洞成立。原先只要同 sprint 的 `working-tree` CR 是最新，就可能被多个 execution 共同拾取；下游 `artifact-pane / governance-query / queue-overview / handoff builder` 又把这个路径当成 execution-scoped review truth 继续传播。
   - 处理：把 `working-tree` fallback 收紧为“只有在同一 `project/sprint` 下不存在 competing execution 时才允许返回”；同时移除 governance query 对 review directory 的伪 review backlink fallback，并把 artifact-pane、execution board / HITL inbox handoff、queue review ownership map 全部对齐到同一规则。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-affordance-builder.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：service 现在只会在 ownership 唯一可证实时把 same-sprint `working-tree` CR 绑定到 execution；否则 review backlink、reviewId 和 review_document handoff 都保持 fail-closed。顺手补上的 shell/sidecar focused tests 也覆盖了 `queryRoleLaneStatus / querySessionContinuity` 的 IPC seam。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
