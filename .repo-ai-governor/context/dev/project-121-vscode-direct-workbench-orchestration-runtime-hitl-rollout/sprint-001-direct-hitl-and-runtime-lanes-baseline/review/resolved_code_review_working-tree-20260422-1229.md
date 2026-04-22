# Code Review: working-tree-20260422-1229

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-005`
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
1. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
2. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-005.md`

## 2. Findings
### 2.1 [P2] role-lane `latestEventType` 会漂移到无关的 follow-up event
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:369`
- 问题描述: 第五轮 reviewer 发现 `buildRoleLaneStatusEntry()` 虽然已经用 `latestLivenessSnapshot` 计算 lane `status`，但 `latestEventType` 仍从 `execution.latestEventType` 读取。这样在 `HITL_REQUIRED` 后又到来一个不带 liveness snapshot 的 `ARTIFACT_READY` 事件时，role lane 会显示 `status=waiting_for_hitl` 却伴随 `latestEventType=artifact.ready`，产生自相矛盾的 lane 投影。
- 影响: VS Code `Runtime Lanes` 会对用户展示错误的“最新 lane 事件”，削弱 sprint-001 想要建立的 service-owned runtime 状态总线一致性。
- 建议: `latestEventType` 在存在 liveness snapshot 时优先读取 `latestLivenessSnapshot.latestEventType`，并补一个 `HITL_REQUIRED -> ARTIFACT_READY(without livenessSnapshot)` 的回归测试。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，属于 read-model 字段一致性问题。
2. 修复后，role lane 的 `status` 与 `latestEventType` 都以最新 liveness snapshot 为准，不再被后续非-liveness 事件误导。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run check:ide-entry-smoke`（通过）
6. `node ./scripts/governance/sync-task-ledger.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
7. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
8. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：role lane projection 现在在有 liveness snapshot 时优先返回 `latestLivenessSnapshot.latestEventType`；shell regression test 也显式覆盖了 `HITL_REQUIRED` 之后又到来 `ARTIFACT_READY` 的分支。
   - 处理：保持 execution summary 对 follow-up artifact 的记录不变，只修正 role-lane read model 的字段来源，避免扩大语义面。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：role-lane `latestEventType` 现在和 lane `status` 共享同一个 liveness snapshot truth，不再被后续无关 execution event 污染。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
