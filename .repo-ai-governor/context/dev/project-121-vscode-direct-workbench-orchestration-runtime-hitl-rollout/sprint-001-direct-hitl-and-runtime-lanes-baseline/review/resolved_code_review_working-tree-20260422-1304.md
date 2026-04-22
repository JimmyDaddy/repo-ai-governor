# Code Review: working-tree-20260422-1304

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-007`
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
1. `packages/core-orchestration-service/src/constants/local-orchestration-service-governance-query.constant.ts`
2. `packages/core-orchestration-service/src/constants/index.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
5. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-007.md`

## 2. Findings
### 2.1 [P2] role-lane projection kept stale HITL snapshot after decision resume/terminate
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:370`
- 问题描述: 第七轮 reviewer 发现 `buildRoleLaneStatusEntry()` 会无条件优先使用最新 liveness snapshot 的 `status/latestEventType`。当 execution 经由 `submitHitlDecision(... resume|terminate)` 离开 HITL 后，summary 已变为 `running/cancelled` 且 `pendingHitl=false`，但 lane 仍可能显示 `waiting_for_hitl / hitl.required`。
- 影响: VS Code `Runtime Lanes` 会向操作者展示错误的 service-owned runtime truth，让已恢复或已终止的 execution 看起来仍在等待人工决策。
- 建议: 仅在 execution 仍处于 HITL 时继续采用该 snapshot；一旦离开 HITL，就回退到最新 execution summary/event，并补一条 `HITL_REQUIRED -> submitHitlDecision(... resume)` 的回归测试。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，属于 direct runtime-lane projection 的 correctness 漂移。
2. 修复聚焦在 role-lane 状态解析分支，不修改已有 HITL packet / affordance / review routing contract。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：query runtime 先前确实在 execution 已恢复后仍优先返回 stale `waiting_for_hitl / hitl.required` liveness snapshot；该分支会让 lane read model 与 execution summary 脱节。
   - 处理：只在 execution 仍为 HITL pending 时才保留这组 snapshot truth；离开 HITL 后改用 execution summary/status event，并增加回归测试覆盖恢复转场。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/constants/local-orchestration-service-governance-query.constant.ts`、`packages/core-orchestration-service/src/constants/index.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`（通过）
   - 说明：role-lane 现在只在 execution 仍处于 HITL pending 时信任 `waiting_for_hitl` snapshot；恢复后会回退到最新 execution summary/event，并由 shell regression test 锁定。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
