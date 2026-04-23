# Code Review: working-tree-20260422-1625

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-016`
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

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
5. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-016.md`

## 2. Findings
### 2.1 [P1] Recovered HITL checkpoints lost service-owned decision-state continuity
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-shell.ts:1090`
- 问题描述: 第 16 轮 reviewer 指出，`applyRecoveredExecution()` 把 checkpoint-recovered execution 标记成 `pendingHitl=true`，但在没有既有 `record.hitlDecisionState` 的情况下不会补建 canonical decision state。
- 影响: 这会让 recovered pending-HITL execution 在 workbench 上显示可提交动作，但 `submitHitlDecision()` 与 `queryHitlDecisionPacket()` 后续都拿不到 canonical state，形成恢复后卡死的 fail-open UI / fail-closed shell 分裂。
- 建议: 在 recovery path 上，当 `pendingInterrupt.kind === 'hitl'` 且本地还没有 persisted decision state 时，按 checkpoint interrupt 的 recordedAt 直接补建 service-owned pending decision state，并用回归测试锁住跨重启场景。

### 2.2 [P2] Role-lane scoped queries bypassed the caller filter on fallback
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:306`
- 问题描述: `resolveScopedExecutions()` 在 scoped set 中找不到 `executionId` 时，会继续走 unfiltered `findExecutionById()` fallback。
- 影响: 调用方即使传了 `projectId/sprintId` filter，也可能意外拿到 scope 外 execution 的 role-lane 数据，破坏 direct workbench query seam 的边界契约。
- 建议: 当调用方显式传入 filter 且 scoped set miss 时直接 fail-closed 返回空集，并补测试保证不会继续触发 unfiltered fallback。

## 3. Notes
1. 本轮 reviewer 返回 2 条 actionable findings，分别是 recovery continuity 的 P1 和 role-lane filter contract 的 P2。
2. reviewer 没有再指出 sprint-001 closeout/gov 面上的新增 blocker。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run check:ide-entry-smoke`（通过）
6. `node ./scripts/governance/sync-task-ledger.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
7. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：checkpoint interrupt 只会在 recovery path 暴露 `pendingInterrupt.kind === 'hitl'`，旧逻辑没有把它转成 persisted service-owned state，确实会让 workbench affordance 与 shell submit/query contract 分裂。
   - 处理：`applyRecoveredExecution()` 现在会在 pending HITL recovery 且本地无现成 state 时，用 checkpoint interrupt 的 recordedAt 补建 canonical pending decision state；shell unit test 直接覆盖跨重启 query + submit。
2. `2.2`
   - 判定：**认可**
   - 证据：`resolveScopedExecutions()` 的 unfiltered fallback 会突破 caller filter，和 direct query seam 的 scope 语义不一致。
   - 处理：scoped miss 且 caller 提供 filter 时改为直接返回空集；governance query runtime test 断言不再触发 unfiltered fallback，也不会读取 scope 外 execution 的 lane events。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`、`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：checkpoint-level HITL recovery 现在会保留 canonical pending decision state，避免 recovered execution 出现“可见可点但永远提交失败”的 stuck seam。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
   - 验证：同上（通过）
   - 说明：role-lane scoped query 现在在 filter miss 时 fail-closed，不再把 scope 外 execution 泄漏回 caller。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
