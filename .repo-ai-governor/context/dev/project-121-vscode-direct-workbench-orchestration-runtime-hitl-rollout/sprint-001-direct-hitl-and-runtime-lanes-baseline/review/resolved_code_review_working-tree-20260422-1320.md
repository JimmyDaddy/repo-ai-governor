# Code Review: working-tree-20260422-1320

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-008`
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
1. `packages/core-orchestration-service/src/constants/index.ts`
2. `packages/core-orchestration-service/src/constants/local-orchestration-service-governance-query.constant.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-governance-affordance-builder.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-hitl-decision-state-factory.ts`
6. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
7. `packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
9. `packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`
10. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-008.md`

## 2. Findings
### 2.1 [P1] HITL decision packets depended on synthetic state that the reviewed runtime never produced
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:224`
- 问题描述: 第八轮 reviewer 发现 `queryHitlDecisionPacket()` 只读取 `readHitlDecisionState()` 的持久化结果。真实 runtime 通过 `publishEvent(HITL_REQUIRED)` 进入 pending-HITL 时并不会自动写入该状态，因此 service 在真实待审批执行上会返回 `undefined`，而现有测试主要靠手工注入 `hitlDecisionState` 掩盖了这个缺口。
- 影响: VS Code `HITL Decision Packet` cockpit 在真实 pending-HITL execution 上可能完全没有数据，导致 direct workbench 不能直接处理待决策项。
- 建议: 让 shell 在真实 `HITL_REQUIRED` 事件上持久化默认 decision state，并让 governance query 对历史缺失状态使用同一 service-owned 模型按真实 `HITL_REQUIRED` 事件时间回退生成，避免 SLA 因后续 artifact 更新而漂移。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，属于 direct-HITL cockpit 在真实运行路径上的 service correctness 缺口。
2. 修复保持 `local_orchestration_service` 为唯一 truth owner，没有把 workflow state 或 HITL shadow state 下沉到 VS Code extension。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`（通过）
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
   - 证据：reviewer 指出的真实路径成立。plain `publishEvent(HITL_REQUIRED)` 之前不会填充 `hitlDecisionState`，因此 `queryHitlDecisionPacket()` 会直接返回空包；现有 shell 测试也确实把 `started561` 的 packet 断言为 `undefined`。
   - 处理：新增统一的 `LocalOrchestrationServiceHitlDecisionStateFactory`，让 shell 在真实 `HITL_REQUIRED` 事件上持久化默认 state；同时让 governance query 在历史缺失 state 时按最新 `HITL_REQUIRED` event 回退合成稳定 packet，并增加 query runtime、shell、sidecar 三层回归测试。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/constants/index.ts`、`packages/core-orchestration-service/src/constants/local-orchestration-service-governance-query.constant.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-affordance-builder.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-hitl-decision-state-factory.ts`、`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：默认 pending-HITL decision model 现在由 service 单点生成并复用到 affordance、shell 持久化与 query fallback；回退 SLA 固定锚定到最新 `HITL_REQUIRED` event 时间，而不是后续 artifact follow-up 的 `updatedAt`。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
