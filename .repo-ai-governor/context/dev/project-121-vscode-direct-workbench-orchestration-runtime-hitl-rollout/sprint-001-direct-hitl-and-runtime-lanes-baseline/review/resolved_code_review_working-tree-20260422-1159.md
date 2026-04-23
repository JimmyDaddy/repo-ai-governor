# Code Review: working-tree-20260422-1159

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-003`
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
2. `packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
6. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-003.md`

## 2. Findings
### 2.1 [P1] review-routing fallback 只修复了文案，没有补齐结构化 review handoff
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:241`
- 问题描述: 第三轮 reviewer 发现 `queryHitlDecisionPacket()` 虽然会在 fallback 路径里把 review 文件写入 `impactSummary`，但 `reviewId`、`decision packet backlinks` 和 `roleLaneStatus.reviewBacklinks` 仍只从 `artifactPane` 读取。这样一来，只要 artifact-pane review metadata 不可用，VS Code workbench 就会失去结构化 review handoff。
- 影响: 这会让 direct-workbench runtime lanes / HITL cockpit 在 fallback 分支上退化成“有人类可读文案、但没有 machine-readable review handoff”，违背 sprint-001 的 service-owned runtime contract。
- 建议: 让 `reviewId / latestReviewPath / reviewBacklinks` 统一从一个 review-resolution helper 派生，并在 artifact-pane 缺少 review metadata 时回退到 review routing runtime 提供的 execution-scoped review document。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，集中在 governance query runtime 的 fallback structuring。
2. 修复后，即使 `artifactPane` 不提供 review metadata，service 仍会给 HITL packet 和 runtime lanes 暴露结构化 review handoff。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
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
   - 证据：`resolveReviewContext()` 现在统一返回 `latestReviewId / latestReviewPath / reviewPaths`，`queryHitlDecisionPacket()` 与 `buildRoleLaneStatusEntry()` 都改为消费这一组 service-owned review truth。
   - 处理：新增 governance query runtime regression test，覆盖 artifact-pane review metadata 缺失但 review routing 仍可解析 execution review document 的分支。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：fallback review routing 现在会同时驱动 `reviewId`、decision packet `backlinks` 与 runtime-lane `reviewBacklinks`，不再只补 `impactSummary` 文案。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需再做一轮 fresh delegated reviewer；只有最新 round 无 actionable findings 时，才能进入 closeout 和边界 commit。
